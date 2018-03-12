#!/usr/bin/env python

""" So - I sometimes want to create an animated GIF from a screen recording
movie.  The ffmpeg commands to do this are frequently beyond me, which is
why I wrote this script.

The idea here is to take a screencast using QuickTime Player thats bundled
on OSX, save that as a .MOV and then convert to an animated GIF using this script
(which basically just chains together a bunch of ffmpeg calls).

This generates a pallete for the gif as described here,
http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html
but also crops out the 1px bar at the bottom of the gif (which I seem
to get as an artifact from quicktime I guess)
"""

from __future__ import print_function

import argparse
import os
import subprocess

# https://github.com/mikeboers/PyAV
# conda install av -c conda-forge
import av


def get_resolution(filename):
    s = av.open(filename).streams.video[0]
    return s.width, s.height


def make_gif(source, dest):
    # temporary filenames (with the suffix appropiate)
    cropped = os.path.join(os.path.dirname(source), 'cropped.' + os.path.basename(source))
    pallete = source + ".pallette.png"

    try:
        # I seem to get a 1px bar at the bottom of the picture, crop it
        width, height = get_resolution(source)
        ret = subprocess.call(['ffmpeg', '-i', source, '-vf',
                               'crop=%s:%s:0:0' % (width, height - 1),
                               cropped, '-y'])
        if ret != 0:
            print("failed to crop image")
            return ret

        # generate the pallette to use in the gif
        filters = "fps=15,scale=640:-1:flags=lanczos"
        ret = subprocess.call(['ffmpeg', '-i', cropped, '-vf', '%s,palettegen' % filters, pallete])
        if ret != 0:
            print("failed to generate pallete")
            return ret

        # convert to a gif
        ret = subprocess.call(['ffmpeg', '-i', cropped, '-i', pallete, '-lavfi',
                               '%s [x]; [x][1:v] paletteuse' % filters, dest])

        if ret != 0:
            print("failed to convert to gif")
            return ret

        print("Converted to GIF at:", dest)
    finally:
        if os.path.isfile(pallete):
            os.unlink(pallete)
        if os.path.isfile(cropped):
            os.unlink(cropped)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Converts a movie into an animated GIF",
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument('filename', metavar="filename", type=str,
                        help='filename of the movie to convert')

    parser.add_argument('--output', type=str,
                        dest='outputfile', help='output file name')

    args = parser.parse_args()
    source = args.filename
    make_gif(source, args.outputfile or source + '.gif')
