#!/bin/sh

if [ -n "$1" ] && [ "$1" = "--handout" ]
then
    pandoc -t beamer -H header.tex -o presentation.pdf -i presentation.md --defaults options
else
    pandoc -t beamer -H header.tex -o presentation.pdf -i presentation.md
fi
