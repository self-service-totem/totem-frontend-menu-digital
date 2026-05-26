# GitHub Makefile Snippet — Frontend

Use this snippet if the frontend repository should create tickets and PRs using the same flow as the backend.

```makefile
GH_CONFIG_DIR_PATH ?= $(HOME)/.config/gh-ffresco
PROJECT_OWNER ?= self-service-totem
PROJECT_NUMBER ?= 1
REPO ?= self-service-totem/totem-frontend

# Shows current gh authentication status using the project-specific config.
gh-auth-status:
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh auth status

# Login gh using the project-specific config.
gh-auth-login:
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh auth login

# Refresh gh auth adding GitHub Projects scope.
gh-auth-refresh-project:
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh auth refresh -s project

# Lists GitHub Projects for the configured owner.
gh-project-list:
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh project list --owner "$(PROJECT_OWNER)"

# Creates a real GitHub issue from a markdown file and adds it to the GitHub Project.
# Title is derived from BODY_FILE name.
# Body is the content of BODY_FILE.
gh-ticket-create:
	@if [ -z "$(BODY_FILE)" ]; then echo "Missing BODY_FILE. Usage: make gh-ticket-create BODY_FILE=<file>"; exit 1; fi
	@if [ ! -f "$(BODY_FILE)" ]; then echo "BODY_FILE not found: $(BODY_FILE)"; exit 1; fi
	@mkdir -p docs/tickets/generated
	@TITLE=$$(basename "$(BODY_FILE)" .md | sed -E 's/^([A-Za-z]+)-([0-9]+)-/\1-\2 /; s/-/ /g'); \
	ISSUE_URL=$$(GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh issue create \
		--repo "$(REPO)" \
		--title "$$TITLE" \
		--body-file "$(BODY_FILE)"); \
	echo "Issue created: $$ISSUE_URL"; \
	ISSUE_NUMBER=$$(basename "$$ISSUE_URL"); \
	echo "$$ISSUE_NUMBER" > docs/tickets/generated/last-ticket-number.txt; \
	echo "$$ISSUE_URL" > docs/tickets/generated/last-ticket-url.txt; \
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh project item-add "$(PROJECT_NUMBER)" \
		--owner "$(PROJECT_OWNER)" \
		--url "$$ISSUE_URL"; \
	echo "Added to Project: https://github.com/orgs/$(PROJECT_OWNER)/projects/$(PROJECT_NUMBER)"; \
	echo "Suggested branch:"; \
	echo "  feature/$$ISSUE_NUMBER-$$(basename "$(BODY_FILE)" .md | sed -E 's/^([A-Za-z]+)-([0-9]+)-//')"

# Creates a GitHub PR from the current branch.
# Base is always develop.
# Body file is derived from the last part of current branch.
gh-pr-create:
	@HEAD=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$HEAD" = "HEAD" ]; then echo "You are in detached HEAD state"; exit 1; fi; \
	if [ "$$HEAD" = "main" ] || [ "$$HEAD" = "develop" ]; then echo "Refusing to create PR from protected branch: $$HEAD"; exit 1; fi; \
	BRANCH_NAME=$$(basename "$$HEAD"); \
	BODY_FILE="docs/tickets/generated/$$BRANCH_NAME.md"; \
	TITLE=$$(echo "$$BRANCH_NAME" | sed -E 's/-/ /g'); \
	if [ ! -f "$$BODY_FILE" ]; then echo "BODY_FILE not found: $$BODY_FILE"; exit 1; fi; \
	echo "Creating GitHub PR:"; \
	echo "  Base: develop"; \
	echo "  Head: $$HEAD"; \
	echo "  Title: $$TITLE"; \
	echo "  Body file: $$BODY_FILE"; \
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh pr create \
		--base develop \
		--head "$$HEAD" \
		--title "$$TITLE" \
		--body-file "$$BODY_FILE"
```
