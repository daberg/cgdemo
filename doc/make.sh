#!/bin/sh

pandoc -t beamer -H header.tex -o presentation.pdf -i presentation.md
