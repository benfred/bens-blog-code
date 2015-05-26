Supporting code for my blog code post on [how beautifuly complicated unicode
is](http://www.benfrederickson.com/unicode-insanity). 

The code here counts up how many similar characters there are in a TTF font
file, by calculating the hamming distance between all pairs in the font.

The python code here should work, but its significantly faster if you build
the c++ extension and run that (for reference, the c++ extension is about 70x
faster than the python extension on my laptop. the python version was so slow
that I actually wrote the c++ version and was looking at its output well before 
it finished running).
