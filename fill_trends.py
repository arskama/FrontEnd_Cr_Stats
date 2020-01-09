import sys
import os.path
import copy
import csv
from os import path


sections = ["Chromium", "Skia", "V8", "WebGL"];

arguments = len(sys.argv) - 1;
date = "none";
startData = 0;
stopData = 0;

if (arguments != 1):
    print "ERROR, QUIT with: No file provided"
    print "Usage: python parse_csv.py <filename>"
    sys.exit(1);

if(path.exists(sys.argv[1]) == False):
    print("ERROR. QUIT with: "  +sys.argv[1] + "file doesnt exist!");
    sys.exit(1);

lineList = [line.rstrip("\n") for line in open (sys.argv[1], "r")];

#Get Date
for line in lineList:
    if "Contributor" in line:
        date = line.rpartition(",")[2];
        print(date)
        break;

##############################################
def getValue(section, lastCompany, Linelist):
    cnt = 0;
    out = [];
    ret = "";
    val = int(0);
    startData = 0 #know from file
    #find first element of section
    for line in lineList:
        # Get start
        if line == section:
            startData = cnt + 2;
        # Get real
        if (startData != 0 and line.find(lastCompany) >= 0):
          #  print(line);
            if (lastCompany == "ibm.com"):
                val += int(line.rpartition(",")[2]);
            else:
                ret = line +","+ date;
        # Get End
        if((len(line.strip()) == 0 and startData != 0 and cnt > startData) or cnt == len(lineList)):
            stopData = cnt;
            break;
        cnt+=1;
    if (ret == ""):
        ret = lastCompany + "," + str(val) + "," + date + ",";
    return ret;

#################################################
#For each section
for section in range(len(sections)):
    cnt = 0;
    print ("iterate for #" + str(section) + " :" + str(sections[section]));


#####Get Trends and lines from backup!!!!
    filename = "/home/amandy/Statistics/FrontEnd_Cr_Stats/Data/Trends/"+str(sections[section])+".csv.bk";
    print(filename);
    trendLine = [line.rstrip("\n") for line in open (filename, "r")];
    #hard copy to write to file!
    copyOfTrend = copy.deepcopy(trendLine);

    company = "none";
    lastCompany = "none";
    companies = [];
    acc = 0;
    cnt = 0;
    for line in trendLine:
        #remove first line.
        if (cnt == 0):
            cnt+=1;
            continue;

        if ((company != line.split(",")[0]) or cnt == len(trendLine)- 1):
            last = cnt;
            lastCompany = company;
            company = line.split(",")[0];
            if (cnt == 1):
                cnt+=1;
                continue;
            else:
                ret = getValue(sections[section], lastCompany, lineList);
                index = acc + last
                if (cnt == len(trendLine) -1):
                    index+=2;
                copyOfTrend.insert(index,ret);
                acc+=1;

        cnt+=1;
    print(copyOfTrend);

    result_file = open("/home/amandy/Statistics/FrontEnd_Cr_Stats/Data/Trends/" + str(sections[section]) + ".csv",'wb')
    for item in copyOfTrend:
        result_file.write(item + "\n");
    result_file.close();
