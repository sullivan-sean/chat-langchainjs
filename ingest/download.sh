# Bash script to ingest data
# This involves scraping the data from the web and then cleaning up and putting in Weaviate.
# Error if any command fails
set -e
echo Downloading docs...
wget -q -r -A.html https://langchain.readthedocs.io/en/latest/
SOURCE_PATH=$(dirname -- ${BASH_SOURCE[0]})
echo Loading data...
python3 "${SOURCE_PATH}/ingest.py"
