# *****Seccion dedicada a git *****#
GH_CONFIG_DIR_PATH ?= $(HOME)/.config/gh-ffresco
PROJECT_OWNER ?= self-service-totem
PROJECT_NUMBER ?= 1

#Salir de dlocal
gh-auth-logout:
	gh auth logout -h github.com
	git credential-osxkeychain erase
# Shows current gh authentication status using the project-specific config.
gh-auth-status:
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh auth status

# Login gh using the project-specific config.
gh-auth-login:
	GH_CONFIG_DIR="$(GH_CONFIG_DIR_PATH)" gh auth login


## *****Seccion dedicada a Claude *****#
.PHONY: claude-personal claude-work claude-status

CLAUDE_DIR := $(HOME)/.claude
CLAUDE_SETTINGS := $(CLAUDE_DIR)/settings.json
CLAUDE_PERSONAL := $(CLAUDE_DIR)/settings.personal.json
CLAUDE_WORK := $(CLAUDE_DIR)/settings.work.json

claude-personal:
	@echo "Backing up current settings to settings.work.json..."
	@cp $(CLAUDE_SETTINGS) $(CLAUDE_WORK)
	@echo "Switching to PERSONAL Claude settings (preserving hooks and permissions)..."
	@python3 -c "import json,copy; t=json.load(open('$(CLAUDE_PERSONAL)')); c=json.load(open('$(CLAUDE_SETTINGS)')); m=copy.deepcopy(t); [m.update({k:c[k]}) for k in ['hooks','permissions'] if k in c]; json.dump(m,open('$(CLAUDE_SETTINGS)','w'),indent=2); print('Personal settings activated (hooks and permissions preserved).')"
	@claude auth logout || true
	@unset ANTHROPIC_AUTH_TOKEN; \
	unset ANTHROPIC_BASE_URL; \
	unset ANTHROPIC_API_KEY; \
	claude auth login
	@claude auth status --text

claude-work:
	@echo "Backing up current settings to settings.personal.json..."
	@cp $(CLAUDE_SETTINGS) $(CLAUDE_PERSONAL)
	@echo "Switching back to WORK Claude settings (preserving hooks and permissions)..."
	@python3 -c "import json,copy; t=json.load(open('$(CLAUDE_WORK)')); c=json.load(open('$(CLAUDE_SETTINGS)')); m=copy.deepcopy(t); [m.update({k:c[k]}) for k in ['hooks','permissions'] if k in c]; json.dump(m,open('$(CLAUDE_SETTINGS)','w'),indent=2); print('Work settings activated (hooks and permissions preserved).')"
	@claude auth logout || true
	@claude auth status --text
	@echo "Work settings restored. Reload VS Code window."

claude-status:
	@claude auth status --text || true
	@env | grep -i anthropic || echo "No Anthropic env vars found."