import { state } from "./state.js";
import { getAllTags } from "./helpers.js";
import { toggleTag } from "./ui.js";

export function render(items) {
  const container = document.getElementById("container");
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    const tags = getAllTags(state, item);
    const visible = tags.slice(0, 3);
    const hidden = tags.slice(3);

    const desc = Array.isArray(item.description)
      ? item.description.join("\n\n")
      : item.description || "";

    div.innerHTML = `
      <div class="left">
        <h3>${item.title}</h3>

        ${item.image ? `<img src="${item.image}" class="card-img">` : ""}

        <div class="bottom">
          <div class="tags">
            ${visible.map(t => `<span class="tag">${t}</span>`).join("")}

            ${hidden.length ? `
              <span class="tag more">+${hidden.length} more</span>
              <div class="hidden-tags">
                ${hidden.map(t => `<span class="tag">${t}</span>`).join("")}
              </div>
            ` : ""}
          </div>

          <a class="download" href="${item.file}" target="_blank">
            Open/Download Files
          </a>
        </div>
      </div>

      <div class="right">
        ${marked.parse(desc)}
      </div>
    `;

    div.addEventListener("click", (e) => {
      if (e.target.closest(".tag") || e.target.closest("a")) return;
      window.open(item.url, "_blank");
    });

    div.querySelectorAll(".tag:not(.more)").forEach(t => {
      t.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleTag(t.textContent.trim());
      });
    });

    const more = div.querySelector(".more");

    if (more) {
      more.addEventListener("click", (e) => {
        e.stopPropagation();

        const hiddenTags = div.querySelector(".hidden-tags");
        const isOpen = hiddenTags.classList.toggle("show");

        more.textContent = isOpen
          ? "Show less"
          : `+${hidden.length} more`;
      });
    }

    container.appendChild(div);
  });
}