import os
import sys
import soundfile
from shutil import copyfile
import ntpath
from threading import Thread, Lock

# make sure hashing is with static seed
os.environ["PYTHONHASHSEED"] = '1'
hashmap = {}
duptolerance = 50
numfiles = 0
numprocessed = 0
numscanned = 0

def format(sourcedir, destinationdir, dumpdir, remoxvedup):
    subdirs = os.listdir(sourcedir)
    for sub in subdirs:
        if sub == "SoundManagerDump":
            continue
        fullpath = sourcedir + "/" + sub
        stagingpath = destinationdir + "/" + sub
        if os.path.isfile(fullpath):
            global numprocessed
            numprocessed += 1
            print_stdout("Processed>>>" + str(numprocessed) + ">>>" + \
                         ntpath.basename(fullpath))
            if screen_file(fullpath, stagingpath, dumpdir):
                continue
            # try to open as a soundfile, err if not possible
            try:
                stagedsf = soundfile.SoundFile(fullpath)
            except RuntimeError as error:
                print_stderr(error)
                if sourcedir == destinationdir:
                    try:
                        os.remove(fullpath)
                    except:
                        print_stderr("Failed due to missing permissions")
                continue
            # read in wav file
            data, samplerate = soundfile.read(fullpath)
            # check if wav is a duplicate, do not format if so
            if removedup == True:
                if check_duplicate(data, fullpath):
                    continue
            # reformat wav if needed
            if (stagedsf.subtype == 'PCM_24' or stagedsf.subtype == 'PCM_16' or \
                stagedsf.subtype == 'PCM_S8' or stagedsf.subtype == 'PCM_U8'):
                if not os.path.exists(stagingpath):
                    copyfile(fullpath, stagingpath)
            elif stagedsf.subtype == 'PCM_32' or stagedsf.subtype == 'FLOAT' or \
                 stagedsf.subtype == 'MS_ADPCM':
                if os.path.exists(stagingpath):
                    try:
                        os.remove(stagingpath)
                    except:
                        print_stderr("Failed due to missing permissions")
                        continue
                try:
                    soundfile.write(stagingpath, data, samplerate, subtype='PCM_24')
                except:
                    print_stderr("Failed to write file")
                    continue
                newdata, _ = soundfile.read(stagingpath)
                # check if newly formatted wav is duplicate, if so delete
                if removedup == True:
                    if check_duplicate(newdata, fullpath):
                        if sourcedir != destinationdir:
                            try:
                                os.remove(stagingpath)
                            except:
                                print_stderr("Failed due to missing permissions")
            else:
                print_stderr(fullpath + " had an unknown bit depth: " + stagedsf.subtype)
                if sourcedir == destinationdir:
                    try:
                        os.remove(fullpath)
                    except:
                        print_stderr("Failed due to missing permissions")
        else:
            if not os.path.exists(stagingpath):
                os.mkdir(stagingpath)
            format(fullpath, stagingpath, dumpdir, removedup)


# identifies and removes duplicates
def check_duplicate(data, fullpath):
    soundhash = str(hash(str(data[1:duptolerance]))) + \
                str(len(data))
    global hashmap
    if hashmap is None:
        hashmap = {}
    if soundhash in hashmap:
        if fullpath == hashmap[soundhash]:
            return False
        if not ntpath.basename(fullpath) == ntpath.basename(hashmap[soundhash]):
            print_stdout("Duplicate>>>" + fullpath + ">>>" + hashmap[soundhash])
        if sourcedir == destinationdir:
            try:
                os.remove(fullpath)
            except:
                print_stderr("Failed due to missing permissions")
        return True
    hashmap[soundhash] = fullpath
    return False

# screens file, returns true if file should be ignored by formatter
def screen_file(fullpath, stagingpath, dumpdir):
    path, file_extension = os.path.splitext(fullpath)
    # if mp3 no formatting is done
    if file_extension == '.mp3':
        if not os.path.exists(stagingpath):
            copyfile(fullpath, stagingpath)
        return True
    if file_extension == '.sf2' or file_extension == '.SF2':
        filename = ntpath.basename(fullpath)
        dumplocation = dumpdir + "/Instruments/SF2" + filename
        if not os.path.exists(dumplocation):
            copyfile(fullpath, dumplocation)
        if fullpath == stagingpath:
            try:
                os.remove(fullpath)
            except:
                print_stderr("Failed due to missing permissions")
        return True
    if file_extension == '.fxp':
        filename = ntpath.basename(fullpath)
        dumplocation = dumpdir + "/Instruments/FXP" + filename
        if not os.path.exists(dumplocation):
            copyfile(fullpath, dumplocation)
        if fullpath == stagingpath:
            try:
                os.remove(fullpath)
            except:
                print_stderr("Failed due to missing permissions")
        return True
    if file_extension == '.fst':
        filename = ntpath.basename(fullpath)
        dumplocation = dumpdir + "/Patches/" + filename
        if not os.path.exists(dumplocation):
            copyfile(fullpath, dumplocation)
        if fullpath == stagingpath:
            try:
                os.remove(fullpath)
            except:
                print_stderr("Failed due to missing permissions")
        return True
    if file_extension == '.mid':
        filename = ntpath.basename(fullpath)
        dumplocation = dumpdir + "/MIDI/" + filename
        if not os.path.exists(dumplocation):
            copyfile(fullpath, dumplocation)
        if fullpath == stagingpath:
            try:
                os.remove(fullpath)
            except:
                print_stderr("Failed due to missing permissions")
        return True
    if file_extension == '':
        return True
    return False


def create_dump(dumpdir):
    if not os.path.exists(dumplocation):
        os.mkdir(dumplocation)
    if not os.path.exists(dumplocation + "/MIDI"):
        os.mkdir(dumplocation + "/MIDI")
    if not os.path.exists(dumplocation + "/Instruments"):
        os.mkdir(dumplocation + "/Instruments")
    if not os.path.exists(dumplocation + "/Instruments/FXP"):
        os.mkdir(dumplocation + "/Instruments/FXP")
    if not os.path.exists(dumplocation + "/Instruments/SF2"):
        os.mkdir(dumplocation + "/Instruments/SF2")
    if not os.path.exists(dumplocation + "/Patches"):
        os.mkdir(dumplocation + "/Patches")


# scan source dir
def count_files(sourcedir):
    subdirs = os.listdir(sourcedir)
    for sub in subdirs:
        if sub == "SoundManagerDump":
            continue
        fullpath = sourcedir + "/" + sub
        if os.path.isfile(fullpath):
            global numfiles
            numfiles += 1
        elif os.path.isdir(fullpath):
            count_files(fullpath)

# scan destination dir
def scan_files(destinationdir):
    subdirs = os.listdir(destinationdir)
    for sub in subdirs:
        if sub == "SoundManagerDump":
            continue
        fullpath = destinationdir + "/" + sub
        if os.path.isfile(fullpath):
            global numscanned
            numscanned += 1
            print_stdout("Scanned>>>" + str(numscanned) + ">>>" + \
                         ntpath.basename(fullpath))
            try:
                data, samplerate = soundfile.read(fullpath)
            except:
                continue
            soundhash = str(hash(str(data[1:duptolerance]))) + \
                        str(len(data))
            global hashmap
            if hashmap is None:
                hashmap = {}
            hashmap[soundhash] = fullpath
        elif os.path.isdir(fullpath):
            scan_files(fullpath)


def print_stdout(message):
    sys.stdout.write(str(message) + "<<<")
    sys.stdout.flush()

def print_stderr(message):
    sys.stderr.write(str(message) + "<<<")
    sys.stderr.flush()

hashmap = None
sourcedir = sys.argv[1]
destinationdir = sys.argv[2]
removedup = (sys.argv[3] == "true")
dumplocation = destinationdir + '/SoundManagerDump'
create_dump(dumplocation)
count_files(destinationdir)
print_stdout("FileCount>>>" + str(numfiles))
if not sourcedir == destinationdir:
    scan_files(destinationdir)
numfiles = 0
count_files(sourcedir)
print_stdout("FileCount>>>" + str(numfiles))
format(sourcedir, destinationdir, dumplocation, removedup)
print_stdout("Done")
