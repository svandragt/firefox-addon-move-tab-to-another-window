VERSION := $(shell node -e "console.log(require('./manifest.json').version)")
ZIP     := move-tab-to-another-window-$(VERSION).zip
FILES   := manifest.json background.js icons/ LICENSE

.PHONY: all package validate clean

all: package

package: clean
	zip -r $(ZIP) $(FILES)

validate: package
	addons-linter $(ZIP)

clean:
	rm -f move-tab-to-another-window-*.zip
