<h2>📁 Resource Hub</h2>
<p>
  <a href="https://lesli-perez.github.io/resource-hub/"><strong>View the website here</strong></a>
</p>

<h3>✚ Adding a New Resource</h3>

<p>
To add a new entry (card/resource), edit <code>files.json</code> and add a new object following this format:
</p>

<pre><code>{
  "title": "String",
  "url": "String (valid URL or path to .html)",
  "file": "String (relative path)",
  "image": "String (relative path)",
  "tags": {
    "Format": ["String"],
    "Time": ["String"],
    "Type": ["String"],
    "Level": ["String"],
    "Topic": ["String"]
  },
  "description": [
    "String (paragraph or HTML, e.g. &lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;)"
  ]
}</code></pre>

<h3>📎 Adding Files & Images</h3>
<ol>
  <li>Create a new folder inside <code>/files</code></li>
  <li>Name it after your resource (use hyphens or camelCase)</li>
  <li>Place all related assets inside that folder</li>
  <li>Reference them using relative paths</li>
  <li><strong>You can find page templates under <code>/files/1-Template-HTML-Pages</code> for project/activity/assignment pages.</strong></li>
</ol>

<pre><code>"file": "files/my-resource/my-file.zip",
"image": "files/my-resource/preview.png"</code></pre>

<h3>⚠️ Important Rules</h3>
<ul>
  <li><strong>All fields are required</strong></li>
  <li><strong>Tags are case-sensitive</strong> — match existing values exactly</li>
  <li>The <code>url</code> can link to an external website or a local <code>.html</code> file</li>
  <li>Use <strong>relative paths</strong> for <code>file</code> and <code>image</code></li>
  <li>Do not leave trailing commas in JSON</li>
  <li>The easiest way to add a new entry is to copy an existing one and modify it.</li>
  <li>Double-check that all URLs, images, and file paths are correct and working before pushing.</li>
</ul>

<hr>

<h3>✚ Adding a New Slide Deck/PowerPoint</h3>

<p>
To add a new entry (slides/PowerPoint), download and save your slides as a <strong>.pdf</strong> file and add it to <code>files/Slides/PDFs</code>, edit <code>slides.json</code> and add a new object following this format:
</p>

<pre>
  <code>{
    "title": "Slide Deck Title",
    "pdf": "../../files/slides/PDFs/PDF-Name.pdf",
    "description": [
        "Topics covered:",
        "String (paragraph or HTML, e.g. &lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;)"
      ]
  }</code>
</pre>

<h3>⚠️ Important Rules</h3>
<ul>
  <li><strong>All fields are required</strong></li>
  <li>Make sure your filetype is .PDF</li>
  <li>Do not leave trailing commas in JSON</li>
  <li>The easiest way to add a new entry is to copy an existing one and modify it.</li>
  <li>Double-check that all URLs, images, and file paths are correct and working before pushing.</li>
</ul>
