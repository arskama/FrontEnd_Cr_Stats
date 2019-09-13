#!/bin/bash
#
# Script to measure the activity of companies contributing to the
# Chromium/Blink/Skia projects.
#
# usage: ./contributors.sh </path/to/chromium/checkout/src> </path/to/output/directory/> 01/march/2015 31/march/2015

if [ ${#} -ne 4 ] ; then
  echo "usage: ${0} <Path to Chromium checkout> <Output directory to store the results> <since> <until>"
  exit 2
fi

readonly GIT_REPOS="
$1
$1/third_party/skia
$1/v8
$1/third_party/webgl
"
# Make sure the Chromium checkout exists.
if [ ! -d "$1" ] ; then
  echo "Oops, could not find Chromium checkout."
  exit 1
fi

# Directory in which to store the results.
# Fail if no arg to specify a directory for the output.
if [ "x$2" = "x" ] ; then
  echo "Oops, no output directory specified."
  exit 1
fi

OUT_DIR=${2}

# Make sure the output directory exists.
if [ ! -d $OUT_DIR ] ; then
  mkdir -p $OUT_DIR || {
    echo Oops, output dir '`'$OUT_DIR"' cannot be created."
    exit 1
  }
else
  ( cd $OUT_DIR && touch DONE && rm DONE ) || {
    echo Oops, output dir '`'$OUT_DIR"' is an invalid directory."
    exit 1
  }
fi

DATEFORMAT=$(echo $3 | awk -F"/" '{print $2,$3}')
REPORT_FILENAME_JSON=$(echo "$OUT_DIR/contributions_$DATEFORMAT.json" |tr ' ' '_')
REPORT_FILENAME_CSV=$(echo "$OUT_DIR/contributions_$DATEFORMAT.csv" |tr ' ' '_')
echo -n "" > "${REPORT_FILENAME_CSV}" 2>&1
echo -n "" > "${REPORT_FILENAME_JSON}" 2>&1
LOGALL=""

# Take the output of "git log" from a range and cut the part of the
# email after @ and count the occurrences.
#
# Store the results in the output directory given as the second argument.


echo -e "{" >> "${REPORT_FILENAME_JSON}" 2>&1
echo -e "\"name\" : \"Overall\"," >> "${REPORT_FILENAME_JSON}" 2>&1
echo -e " \"children\": [" >> "${REPORT_FILENAME_JSON}" 2>&1

#ugly hack
cnt=0;

for REPO in $GIT_REPOS; do
    # Make sure the repo directory exists.
    if [ -d $REPO ] ; then
      REPO_NAME=$(basename $REPO)
      if [ "$REPO_NAME" == "src" ] ; then
        REPO_NAME="chromium"
      elif [ "$REPO_NAME" = "webgl" ]; then
        REPO+="/src"
        REPO_NAME="WebGL"
      fi

      if [ cnt != 0 ]; then
        echo -e "    }," >> "${REPORT_FILENAME_JSON}" 2>&1
      fi;
      cnt=1;

      LOG=$(git -C $REPO log --pretty=%ae --since=$3 --until=$4 |cut -d@ -f1,2 |grep -v \
      commit-bot@chromium.org |grep -v commit-queue@webkit.org |grep -v \
      chrome-admin@google.com|grep -v gitdeps@chromium.org |grep -v \
      gserviceaccount.com |grep -v chrome-release-bot@chromium.org | grep -v \
      blink-w3c-test-autoroller@chromium.org | cut -d@ -f2)

      LOGALL+="$LOG"$'\n'

      echo -e "    {" >> "${REPORT_FILENAME_JSON}" 2>&1
      echo -e "        \"name\": \"${REPO_NAME^}\"," >> "${REPORT_FILENAME_JSON}" 2>&1
      echo -e "        \"children\": [" >> "${REPORT_FILENAME_JSON}" 2>&1

      echo -e "\n${REPO_NAME^}\nContributor,${DATEFORMAT^}" >> "${REPORT_FILENAME_CSV}" 2>&1
      echo "${LOG}"|sort |uniq -c |sort -n -r |awk -v OFS="," '{print $2, $1}' >> "${REPORT_FILENAME_CSV}" 2>&1
      echo "${LOG}"|sort |uniq -c |sort -n -r |awk -v OFS="," '{print "        " "{" "\"name\": \"" $2"\"", " \"size\": "$1"}"","}' >> "${REPORT_FILENAME_JSON}" 2>&1
      sed -i '$ s/.$//' ${REPORT_FILENAME_JSON} 

      echo -e "        ]" >> "${REPORT_FILENAME_JSON}" 2>&1

    fi
done
echo -e "    }" >> "${REPORT_FILENAME_JSON}" 2>&1
echo -e " ]" >> "${REPORT_FILENAME_JSON}" 2>&1
echo -e "}" >> "${REPORT_FILENAME_JSON}" 2>&1

# Overall results
echo -e "Chromium project contributions from $3 to $4\n\nOverall\nContributor,${DATEFORMAT^}" > "$OUT_DIR/temp" 2>&1
echo "${LOGALL}"|grep .|sort |uniq -c |sort -n -r |awk -v OFS="," '{print $2, $1}' |head >> "$OUT_DIR/temp" 2>&1
cat "${REPORT_FILENAME_CSV}" >> "$OUT_DIR/temp"
mv "$OUT_DIR/temp" "${REPORT_FILENAME_CSV}"

echo "Done, please see the results in $OUT_DIR:"
ls -l $OUT_DIR
