#   BSD License:
  
#   ErrFilter: Exploratory Error Analysis
  
#   Copyright © 2019, Battelle Memorial Institute
  
#   All rights reserved.
  
#   1. Battelle Memorial Institute (hereinafter Battelle) hereby grants permission
#      to any person or entity lawfully obtaining a copy of this software and
#      associated documentation files (hereinafter “the Software”) to redistribute
#      and use the Software in source and binary forms, with or without 
#      modification.  Such person or entity may use, copy, modify, merge, publish,
#      distribute, sublicense, and/or sell copies of the Software, and may permit
#      others to do so, subject to the following conditions:
#      * Redistributions of source code must retain the above copyright notice,
#        this list of conditions and the following disclaimers.
#      * Redistributions in binary form must reproduce the above copyright notice,
#        this list of conditions and the following disclaimer in the documentation
#        and/or other materials provided with the distribution.
#      * Other than as used herein, neither the name Battelle Memorial Institute
#        or Battelle may be used in any form whatsoever without the express
#        written consent of Battelle. 
  
#   2. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
#      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
#      THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
#      PURPOSEARE DISCLAIMED. IN NO EVENT SHALL BATTELLE OR CONTRIBUTORS BE LIABLE
#      FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
#      DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
#      SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
#      CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
#      LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
#      OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
#      DAMAGE.

import json, base64, argparse, time
from PIL import Image
from io import BytesIO
import requests
from twython import Twython
from pymongo import MongoClient
import pandas as pd

def imgToBase64(img, format):
    buffered = Image.open(BytesIO(img))
    encodingBuff = BytesIO()
    buffered.save(encodingBuff, format=format)
    s = base64.b64encode(encodingBuff.getvalue()).decode('ascii')
    return f'data:image/{format};base64,{s}'

def base64ToImg(s):
    start = s.find(',') + 1
    imgdata = base64.b64decode(str(s[start:]))
    return Image.open(BytesIO(imgdata))


def download_images(image_url):
    """
    Downloads image content given by URL
    :param image_url: URL for image. Ex: https://twitter.com/Cur89henvfpavnfka.jpg
    :return: image data
    """

    try:  # Try for valid link
        img_data = requests.get(image_url).content
        if img_data:  # Check if content is returned from request.get (some images get removed)
            return img_data
        else:
            print("Image does not exist")
            return None
    except:
        print("Invalid link")
        return None

# document format:
# { '_id'  : 'tag:search.twitter.com,2005:77863...',
#   'body' : 'The content of the tweet',
#   'src'  : 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgG...' }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-t', '--twitter', default='./credentials.json', help='Twitter credentials file (JSON)')
    parser.add_argument('-i', '--input', default='./data/small-ensemble.json', help='Path to data file to load')
    parser.add_argument('-m', '--mongo', default='{}', help='MongoDB conection information--defaults to localhost:27017')
    parser.add_argument('-s', '--sleep', default=1.0, type=float, help='Seconds between API requests')
    parser.add_argument('-x', '--drop', action='store_true', help='Drop data collection before fetching')

    args = parser.parse_args()
    print(args)

    client = MongoClient(**json.loads(args.mongo))
    db = client.fpa_deception
    collection = db.data

    with open(args.input) as fp:
        if args.drop:
            print(f'Clearing all instance data...')
            collection.delete_many({})

        # load the model from disk
        model = json.load(fp)

        # fetch the data from the model's index and add it to the database
        to_fetch = model['index']

        has_src = {}
        has_body = {}

        with open(args.twitter) as fp:
            tweet = Twython(**json.load(fp))
            for i, _id in enumerate(to_fetch):
                has_body[_id] = 'N'
                has_src[_id] = 'N'

                print(f'{i}/{len(to_fetch)}', end=' ')
                doc = { '_id': _id}

                try:
                    new_tweet = tweet.show_status(id=_id)
                    doc['body'] = new_tweet['text']

                    image_url = new_tweet["entities"]["media"][0]["media_url_https"]
                    img_data = download_images(image_url)
                    if img_data:
                        doc['src'] = imgToBase64(img_data, format="jpeg")
                        has_src[_id] = 'Y'
                    has_body[_id] = 'Y'

                    print('OK')

                except Exception as e:
                    doc['body'] = str(e)
                    print(e)

                collection.insert_one(doc)

                time.sleep(args.sleep)

                # if i > 15:
                #     break

        # add the model to the database
        _id = model['_id']
        del model['_id']

        model = pd.concat((pd.DataFrame(**model),
                           pd.Series(has_body, name='has_body'),
                           pd.Series(has_src, name='has_image')),
                          axis=1, sort=True)\
            .fillna('N')\
            .to_dict(orient='split')

        model['_id'] = _id

        db.models.delete_one({'_id': _id})
        db.models.insert_one(model)

    print('Done.')
