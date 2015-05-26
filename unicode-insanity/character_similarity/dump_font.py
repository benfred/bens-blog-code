import time
import datetime
from collections import defaultdict

import numpy

import Image
import ImageFont
import ImageDraw

import ttfquery.describe
import ttfquery.glyphquery

# white text on a black background
_TEXT_COLOUR = (255, 255, 255)
_BACKGROUND_COLOUR = (0, 0, 0)

# use a 12 point font, on a 16x16 image
_SIZE = (16, 16)
_FONT_SIZE = 12


def get_supported_chars(font):
    """ gets supported characters from a font object. Only really supports the
    Basic multilingual plane characters right now """
    print "getting", font
    f = ttfquery.describe.openFont(font)
    for value in xrange(2 ** 16):
        char = unichr(value)
        if ttfquery.glyphquery.explicitGlyph(f, char):
            yield char


def get_char_array(font, char):
    """ Represents a character in a font as a numpy array of pixels """
    image = Image.new("RGBA", _SIZE, _BACKGROUND_COLOUR)
    draw = ImageDraw.Draw(image)
    draw.text((0, 0), char, _TEXT_COLOUR, font=font)

    return numpy.array(image.convert("L").getdata(),
                       dtype=numpy.float)


def get_char_arrays(fontfile):
    font = ImageFont.truetype(fontfile, _FONT_SIZE)

    for char in get_supported_chars(fontfile):
        yield char, get_char_array(font, char)


def all_pairs_hamming_python(images, threshold):
    """ python version of calculating hamming distance between a bunch of
    images. super slow """
    images = [set(i for i, value in enumerate(image) if value > 128)
              for image in images]
    start_time = time.time()
    for i, image in enumerate(images):
        for j in xrange(i + 1, len(images)):
            distance = len(image.symmetric_difference(images[j]))
            if distance <= threshold:
                yield i, j, distance

        if i and i % 100 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed
            eta = (len(images) - i) / (rate + 1e-10)
            print "processed %i rate %.1f eta %s" % (
                i, rate, datetime.timedelta(seconds=eta))


try:
    from all_pairs_hamming import all_pairs_hamming
except ImportError, e:
    print "failed to find native extension, using python version"
    all_pairs_hamming = all_pairs_hamming_python


def get_similar_chars(fontfile, threshold=5):
    """ gets all characters that differ by only 'threshold' pixels from a font
    """
    char_images = list(get_char_arrays(fontfile))
    print "%s has %i detectable chars defined" % (fontfile, len(char_images))

    chars = [c for c, _ in char_images]
    images = [i for _, i in char_images]
    scores = sorted(all_pairs_hamming(images, threshold),
                    key=lambda x: x[2])

    ret = defaultdict(list)
    for a, b, s in scores:
        a, b = chars[a], chars[b]
        ret[a].append((b, s))
        ret[b].append((a, s))

    return ret

if __name__ == "__main__":
    # best unicode support on my laptop
    font = "/Library/Fonts/Arial Unicode.ttf"

    pixel_diff = 5
    chars = get_similar_chars(font, pixel_diff)
    histogram = defaultdict(int)

    for char, similar in chars.iteritems():
        histogram[similar[0][1]] += 1

    cumulative = 0
    for x in xrange(pixel_diff + 1):
        cumulative += histogram[x]
        print x, histogram[x], cumulative
        
