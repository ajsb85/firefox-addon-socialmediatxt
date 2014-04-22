##
# Copyright 2014 Alexander Salas
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.mozilla.org/MPL/2.0/
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
##

# The name of the extension.
extension_name := socialmediatext

# The UUID of the extension.
extension_uuid := socialmediatext@xulforge.com

# The name of the profile dir where the extension can be installed.
profile_dir := socialmediatext-dev

# The zip application to be used.
ZIP := zip

# The target XPI file.
xpi_file := ../bin/$(extension_name).xpi

# The type of operating system this make command is running on.
os_type := $(patsubst darwin%,darwin,$(shell echo $(OSTYPE)))

# The location of the extension profile.
ifeq ($(os_type), darwin)
  profile_location := \
    ~/Library/Application\ Support/Firefox/Profiles/$(profile_dir)/extensions/
else
  ifeq ($(os_type), linux-gnu)
    profile_location := \
      ~/.mozilla/firefox/$(profile_dir)/extensions/
  else
    profile_location := \
      "$(subst \,\\,$(APPDATA))\\Mozilla\\Firefox\\Profiles\\$(profile_dir)\\extensions\\"
  endif
endif

# This builds the extension XPI file.
.PHONY: all
all: $(xpi_file)
	@echo
	@echo "Build finished successfully."
	@echo

# This cleans all temporary files and directories created by 'make'.
.PHONY: clean
clean:
	@rm -f $(xpi_file)
	@echo "Cleanup is done."

# The sources for the XPI file. Uses variables defined in the included
# Makefiles.
xpi_built := install.rdf \
             bootstrap.js \
             chrome.manifest \
             icon.svg \
             $(wildcard skin/*.css) \
             $(wildcard skin/*.svg) \
             $(wildcard content/*.html) \

$(xpi_file): $(xpi_built)
	@echo "Creating XPI file."
	@$(ZIP) $(xpi_file) $(xpi_built)
	@echo "Creating XPI file. Done!"

.PHONY: install
install: $(xpi_file)
	@echo "Installing in profile folder: $(profile_location)"
	@cp -fL $(xpi_file) $(profile_location)/$(extension_uuid).xpi
	@echo "Installing in profile folder. Done!"
	@echo
