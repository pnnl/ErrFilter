
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

import os

import flask
from pymongo import MongoClient

def start_app(app, mongo, **kwargs):

    client = MongoClient(mongo)

    @app.route('/api/')
    def list_datasets():
        doc = {x: client[x].models.distinct('_id')
               for x in client.database_names() if x.startswith('fpa_')}

        return flask.jsonify(doc)

    @app.route('/api/<dataset>/<collection>/<_id>')
    def get_data(dataset, collection, _id):
        doc = client[dataset][collection].find_one({'_id': _id})
        return flask.jsonify(doc)

    app.run(threaded=True, **kwargs)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('-p','--port', help='port', default=8891, type=int)
    parser.add_argument('-d','--debug', default=False, help='run as debug', action='store_true')
    parser.add_argument('-m','--mongo', default=None, help='URL for MongoDB')
    parser.add_argument('-o','--host', default=None, help='Host')

    args = vars(parser.parse_args())

    print( ' * starting app')
    print( '   *', args)

    app = flask.Flask(__name__)
    app.secret_key = os.urandom(2557555)

    start_app(app, **args)
