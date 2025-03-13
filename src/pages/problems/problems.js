import "./style.scss";
import Page from "components/page";
import actionStack from "lib/actionStack";
import EditorFile from "lib/editorFile";
import helpers from "utils/helpers";


export default function Problems() {
	const $page = Page(strings.problems);
	/**@type {EditorFile[]} */
	const files = editorManager.files;
	const $content = document.createElement("div");
	$content.id = "problems";

	files.forEach((file) => {
		if (file.type !== "editor") return;

		/**@type {[]} */
		const annotations = file.session?.getAnnotations() || [];
		if (annotations.length === 0) return;

		const details = document.createElement("details");
		details.className = "single-file";
		details.open = true;

		const summary = document.createElement("summary");
		summary.textContent = `${file.name} (${annotations.length})`;
		details.appendChild(summary);

		const problemsDiv = document.createElement("div");
		problemsDiv.className = "problems";

		annotations.forEach((annotation) => {
			let icon = "info";

			switch (annotation.type) {
				case "error":
					icon = "cancel";
					break;
				case "warning":
					icon = "warningreport_problem";
					break;
				default:
					break;
			}

			const problemDiv = document.createElement("div");
			problemDiv.className = "problem";
			problemDiv.dataset.action = "goto";
			problemDiv.dataset.fileId = file.id;
			problemDiv.dataset.annotation = JSON.stringify(annotation);

			problemDiv.innerHTML = `
				<span class="icon ${icon}"></span>
				<span data-type="${annotation.type}" class="problem-message">${annotation.text}</span>
				<span class="problem-line">${annotation.row + 1}:${annotation.column + 1}</span>
			`;

			problemsDiv.appendChild(problemDiv);
		});

		details.appendChild(problemsDiv);
		$content.appendChild(details);
	});

	$content.addEventListener("click", clickHandler);
	$page.content = $content;
	app.append($page);
	helpers.showAd();

	$page.onhide = function () {
		helpers.hideAd();
		actionStack.remove("problems");
	};

	actionStack.push({
		id: "problems",
		action: $page.hide,
	});

	/**
	 * Click handler for problems page
	 * @param {MouseEvent} e
	 */
	function clickHandler(e) {
		const $target = e.target.closest(".problem");
		if (!$target) return;

		const { action, fileId } = $target.dataset;

		if (action === "goto") {
			const annotation = JSON.parse($target.dataset.annotation);
			if (!annotation) return;

			editorManager.switchFile(fileId);
			editorManager.editor.gotoLine(annotation.row + 1, annotation.column);
			$page.hide();

			setTimeout(() => {
				editorManager.editor.focus();
			}, 100);
		}
	}
}
