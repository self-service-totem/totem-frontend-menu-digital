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
	@echo "Switching to PERSONAL Claude settings..."
	@cp $(CLAUDE_PERSONAL) $(CLAUDE_SETTINGS)
	@claude auth logout || true
	@unset ANTHROPIC_AUTH_TOKEN; \
	unset ANTHROPIC_BASE_URL; \
	unset ANTHROPIC_API_KEY; \
	claude auth login
	@claude auth status --text

claude-work:
	@echo "Switching back to WORK Claude settings..."
	@cp $(CLAUDE_WORK) $(CLAUDE_SETTINGS)
	@echo "Work settings restored. Reload VS Code window."

claude-status:
	@claude auth status --text || true
	@env | grep -i anthropic || echo "No Anthropic env vars found."