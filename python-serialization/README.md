Python Serialization Benchmark
=======

Code to measure the rate of a couple different python serialization libraries.
Details are in the [blog
post](http://www.benfrederickson.com/dont-pickle-your-data/).

### OSX install

    brew install thrift
    pip install -r requirements.txt


If you have isues with not being able to build matplotlib due to not finding
freetype, try:

    ln -s /usr/local/opt/freetype/include/freetype2 /usr/local/include/freetype
