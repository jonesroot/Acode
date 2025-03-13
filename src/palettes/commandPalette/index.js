import palette from "components/palette";
import helpers from "utils/helpers";

export default async function commandPalette() {
	const recentCommands = RecentlyUsedCommands();
	const { editor } = editorManager;
	const commands = Object.values(editor.commands.commands);

	const isEditorFocused = editor.isFocused();

	palette(generateHints, onselect, strings["type command"], () => {
		if (isEditorFocused) editor.focus();
	});

	function generateHints() {
		const hints = [];

		commands.forEach(({ name, description, bindKey }) => {
			/**
			 * @param {boolean} recentlyUsed Is the command recently used
			 * @returns {{value: string, text: string}}
			 */
			const item = (recentlyUsed) => ({
				value: name,
				text: `<span ${recentlyUsed ? `data-str='${strings["recently used"]}'` : ""}>${description ?? name}</span>${
					bindKey?.win ? `<small>${bindKey.win}</small>` : ""
				}`,
			});
			if (recentCommands.commands.includes(name)) {
				hints.unshift(item(true));
				return;
			}
			hints.push(item(false));
		});

		return hints;
	}

	function onselect(value) {
		const command = commands.find(({ name }) => name === value);
		if (!command) return;
		recentCommands.push(value);
		command.exec?.(editorManager.editor);
	}
}

function RecentlyUsedCommands() {
	let commands = helpers.parseJSON(localStorage.getItem("recentlyUsedCommands")) || [];

	return {
		/**
		 * @returns {string[]}
		 */
		get commands() {
			return commands;
		},
		/**
		 * Saves command to recently used commands
		 * @param {string} command Command name
		 * @returns {void}
		 */
		push(command) {
			if (commands.includes(command)) {
				commands.splice(commands.indexOf(command), 1);
			}
			commands.unshift(command);
			if (commands.length > 10) {
				commands = commands.slice(0, 10);
			}
			localStorage.setItem("recentlyUsedCommands", JSON.stringify(commands));
		},
	};
}
