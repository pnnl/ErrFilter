# Explaining Deceptive News Prediction Models 
### Ayton E.M., B.J. Hutchinson, D.L. Arendt, and S. Volkova.
### ICWSM"19 Poster Session

Social media plays a valuable role in rapid news dissemination, but it also serves as a vehicle to propagate unverified information. For example, news shared on Facebook or Twitter may actually contain disinformation, propaganda, hoaxes, conspiracies, clickbait or satire. This paper presents an in-depth analysis of the behavior of suspicious news classification models including error analysis and prediction confidence. We consider five deep learning architectures that leverage combinations of text, linguistic and image input signals from tweets. The behavior of these models is analyzed across four suspicious news prediction tasks. Our findings include that models leveraging only the text of tweets outperform those leveraging only the image (by 3-13% absolute in F-measure), and that models that combine image and text signals with linguistic cues e.g., biased and subjective language markers can, but do not always, perform even better.  Finally, our main contribution is a series of analyses, in which we characterize text and image traits of our classes of suspicious news and analyze patterns of errors made by the various models to inform the design of future deceptive news prediction models.

# How to Cite
If you this work inspires your research, please cite the following paper:

[Ayton E.M., B.J. Hutchinson, D.L. Arendt, and S. Volkova. 2019. "Explaining Deceptive News Prediction Models." In ICWSM 2019.](https://www.icwsm.org/2019/program/program/)
```

@inproceedings{ayton2019explainingDeceptive,
  title={Explaining Deceptive News Prediction Models.},
  author={Ayton, E.M. and B.J. Hutchinson and D.L. Arendt and S. Volkova},
  booktitle={in Proceedings of the 13th International Conference on Web and Social Media},
  year={2019},
  organization={ICWSM}
}
```

# Setup

## Dependencies
Install MongoDB. For example, on MacOS the easiest way to do this is with [Homebrew](https://brew.sh), by running the following command.

```bash
brew install mongodb
```

For other platforms, see the [MongoDB installation guide](https://docs.mongodb.com/manual/installation/).

Create a python 3.5^ environment. The recommended installation procedure is to use [Anaconda](https://www.anaconda.com/download/) to create a basic environment, then install the chissl package using pip.

```bash
conda create -n chissl scipy pandas scikit-learn matplotlib
conda activate chissl
cd python-chissl
pip install .
```

You may wish to use Node Version Manager to install local user copies of node, avoiding pesky permission problems.
```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
nvm install node
```



ErrFilter is a React app, which can be run in development mode using the following commands after [node.js](https://nodejs.org/en/) is installed.
```bash
npm install
npm start
```

## Acquiring Data
The data for the tool that was analyzed for the paper can"t be hosted on GitHub, and must be fetched using your own Twitter credentials. See the documentation in the file below. Much of this original data is no longer available.
```bash
python fetch.py
```

# MongoDB
## Models Collection
Models are stored in a MongoDB collection called `models`

```json
[ { "_id"     : "small-ensemble",
    "index"   : ["1xN array of twitter ids"],
    "columns" : ["1xM array of feature names"],
    "data"    : [["NxM array of features"]] } ]
```

Each model is a document in this collection. Each models is stored in a JSON encoded Pandas "split" format plus the required `_id` field. So, they can be loaded in pandas as follows:

```python
import json
import pandas as pd

with open("./data/small-ensemble.json") as fp:
    doc = json.load(fp)
    del doc["_id"]
    df = pd.DataFrame(**doc)
```


## Data Collection
Each tweet is stored as a document within the ``data`` collection. Documents contain an `_id` field, which is the Twitter id, plus a `body`, which is the string/text content of the tweet, and a `src` which is a Base64 encoded string representation of the image content.

```json
[ { "_id"  : "tag:search.twitter.com,2005:77863...",
    "body" : "The content of the tweet",
    "src"  : "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgG..." } ]
```