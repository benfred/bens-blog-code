""" converts a CSV of city/latd/latm/longd/longm/tz tuples into a JSON file
containing distances between each city on a mercator projection 

adapted from http://stackoverflow.com/questions/14329691/covert-latitude-longitude-point-to-a-pixels-x-y-on-mercator-projection

"""

from math import tan, pi, log, sqrt
import pandas
import json
import argparse


def mercator(latitude, longitude, height, width):
    # get x value
    x = (longitude + 180) * (width / 360)

    # convert from degrees to radians
    latRad = latitude * pi / 180

    # get y value
    mercN = log(tan((pi / 4) + (latRad / 2)))
    y = (height / 2) - (width * mercN / (2 * pi))
    return x, y


def dms_to_decimal(degrees, minutes, seconds=0):
    return degrees + minutes / 60. + seconds / 3600.


def mercatorize(filename, width=3000, height=5000):
    data = pandas.read_csv(filename, names=['city', 'latd', 'latm', 'longd', 'longm', 'tz'])
    data['lat'] = [dms_to_decimal(d, s) for d, s in zip(data['latd'], data['latm'])]
    data['long'] = [dms_to_decimal(d, s) for d, s in zip(data['longd'], data['longm'])]

    for city, lat, lon in zip(data['city'], data['lat'], data['long']):
        x, y = mercator(lat, lon, width, height)
        yield city.split(",")[0], x, y


def get_distances(filename):
    coords = list(mercatorize(filename))

    distances = []
    labels = []
    for city1, x1, y1 in coords:
        row = []
        for _, x2, y2 in coords:
            row.append(sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)))
        distances.append(row)
        labels.append(city1)
    json.dump({'distances': distances, 'labels': labels}, open(filename + ".json", "wb"),
              indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Converts a csv of city/lat/long info into a JSON "
                                     "file of the euclidean distances on a mercator projection")

    parser.add_argument('filename', metavar="filename", type=str,
                        help='csv file to convert')
    args = parser.parse_args()
    get_distances(parser.parse_args().filename)
