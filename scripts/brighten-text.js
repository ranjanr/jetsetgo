const fs = require("fs");
const path = require("path");

const files = [
  path.join(process.cwd(), "src/app/page.tsx"),
  path.join(process.cwd(), "src/app/workspace/page.tsx"),
  path.join(process.cwd(), "src/app/mentor/page.tsx")
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    
    // Map of text contrast upgrades
    const replacements = [
      { from: /text-slate-500/g, to: "text-slate-300" },
      { from: /text-slate-400/g, to: "text-slate-200" },
      { from: /text-slate-600/g, to: "text-slate-400" },
      { from: /text-slate-300/g, to: "text-slate-100" }
    ];

    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });

    fs.writeFileSync(file, content, "utf8");
    console.log(`Upgraded contrast for: ${path.basename(file)}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
