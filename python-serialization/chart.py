"""
Generate the graphs used in this post (using matplotlib)
"""
import numpy
import matplotlib.pyplot as pyplot
import json

BAR_WIDTH = 0.35
OPACITY = 0.4

def speedChart(data):
    fig, ax = pyplot.subplots()
    groups = len(data)
    index = numpy.arange(groups)

    rects1 = pyplot.bar(index, 
                        [d['packRate'] for d in data], 
                        BAR_WIDTH,
                        alpha=OPACITY,
                        color='b',
                        label='Pack')

    rects2 = pyplot.bar(index + BAR_WIDTH, 
                        [d['unpackRate'] for d in data],
                        BAR_WIDTH,
                        alpha=OPACITY,
                        color='r',
                        label='Unpack')

    pyplot.ylabel('Rate (items/second)')
    pyplot.xticks(index + BAR_WIDTH, [d['method'] for d in data])
    pyplot.legend(loc='upper left')

    pyplot.tight_layout()
    pyplot.show()

def sizeChart(data):
    groups = len(data)

    fig, ax = pyplot.subplots()
    index = numpy.arange(groups)
    rects1 = pyplot.bar(index, 
                        [d['averageSize'] for d in data], 
                        BAR_WIDTH,
                        alpha=OPACITY,
                        color='b')

    pyplot.ylabel('Average Size (bytes)')
    pyplot.xticks(index + BAR_WIDTH/2, [d['method'] for d in data])
    pyplot.tight_layout()
    pyplot.show()

if __name__ == "__main__":
    data = json.load(open("speed_data.json"))
    speedChart(data)
    sizeChart(data)
