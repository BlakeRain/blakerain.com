import logging
import os
import sys

WHERE_AM_I = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, WHERE_AM_I + "/dependencies")
logging.root.setLevel(logging.INFO)
