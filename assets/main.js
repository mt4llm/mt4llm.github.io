// Asynchronously loads and parses JSON from a given URL
async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function latexToHTML(s) {
  if (!s) return "";
  return s
    .replaceAll(/\$(.*)\$/g, "\\($1\\)") // MathJax inline math format
}

// Main IIFE to initialize the UI logic
(async function() {
  // Load both the MRs and references JSON files
  const [data, refs] = await Promise.all([
    loadJSON('/assets/mrs.json'),
    loadJSON('/assets/refs.json')
  ]);

  // console.log(refs);

  const list = document.getElementById('list');
  const tmpl = document.getElementById('mrTemplate');

  // Extract all unique tasks from MRs to populate the filter dropdown
  const taskSet = new Set();
  data.mrs.forEach(mr => mr.tasks.forEach(t => taskSet.add(t)));


  console.log(data);

  const taskFilter = document.getElementById('taskFilter');
  [...taskSet].sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    taskFilter.appendChild(opt);
  });

  const search = document.getElementById('search');

  // Function to render filtered MRs into the DOM
  function render() {
    const q = (search.value || '').toLowerCase().trim();
    const tf = taskFilter.value;
    list.innerHTML = '';

    // Filter based on search query and selected task
    const matches = data.mrs.filter(mr => {
      const text = (mr.ri + " " + mr.ro).toLowerCase();
      const taskOK = !tf || mr.tasks.includes(tf);
      const queryOK = !q || text.includes(q) || ('mr ' + mr.id).includes(q);
      return taskOK && queryOK;
    });

    // For each matched MR, clone template and populate with content
    for (const mr of matches) {
      const node = tmpl.content.cloneNode(true);
      node.querySelector('.mr-id').textContent = mr.id;
      node.querySelector('.tasks').textContent = mr.tasks.join(', ');
      node.querySelector('.ri span').innerHTML = latexToHTML(mr.ri);
      node.querySelector('.ro span').innerHTML = latexToHTML(mr.ro);

      const refList = node.querySelector('.ref-list');
      const refCount = node.querySelector('.ref-count');
      let count = 0;

      // Populate the reference list for each MR
      for (const r of mr.references) {
        const li = document.createElement('li');
        const entry = refs[r];
        // console.log(r)

        if (entry && entry.formatted) {
          li.textContent = entry.formatted; // Use formatted citation
        } else if (entry && entry.raw) {
          // Use raw BibTeX fallback (cropped)
          const pre = document.createElement('pre');
          pre.textContent = entry.raw;
          li.appendChild(pre);
        } else {
          li.textContent = r.key; // Fallback to showing the key
        }

        refList.appendChild(li);
        count += 1;
      }

      refCount.textContent = count;
      list.appendChild(node);

      console.log("hi"); // Debug log per item
    }

    // Re-render LaTeX if MathJax is available
    if (window.MathJax) {
      MathJax.typesetPromise();
    }
  }

  // Set up live filtering
  search.addEventListener('input', render);
  taskFilter.addEventListener('change', render);

  // Initial render
  render();
})();
