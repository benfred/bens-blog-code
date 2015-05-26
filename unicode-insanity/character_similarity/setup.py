from distutils.core import setup, Extension
import platform

all_pairs_hamming = Extension('all_pairs_hamming',
                              sources=['all_pairs_hamming.cpp'],
                              libraries=['boost_python'])

setup(name='all_pairs_hamming', version='0.1.0',
      ext_modules=[all_pairs_hamming])
