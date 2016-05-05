SRC=$(shell find chrome defaults 2>/dev/null) install.rdf chrome.manifest LICENSE
ID=patchcmd@qoba.lt

.PHONY: clean

xpi: ./$(ID).xpi

%.xpi: $(SRC)
	zip -r $@ $^

clean:
	rm -f ./$(ID).xpi
