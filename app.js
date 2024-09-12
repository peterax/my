// Initialize Mermaid
mermaid.initialize({ startOnLoad: true });

let xmlDoc;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const app = document.getElementById('app');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', handleFileDrop);
fileInput.addEventListener('change', handleFileSelect);

function handleFileDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const xmlString = e.target.result;
        xmlDoc = parseXML(xmlString);
        initializeApp();
    };
    reader.readAsText(file);
}

function parseXML(xmlString) {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
}

function initializeApp() {
    dropZone.style.display = 'none';
    app.style.display = 'flex';
    const sequences = xmlDoc.querySelectorAll("SequencesGroup");
    const subflowList = document.getElementById('subflow-list');
    subflowList.innerHTML = '';
    
    sequences.forEach(sequence => {
        const name = sequence.querySelector("SequenceGroupName").textContent;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = name;
        a.onclick = (e) => {
            e.preventDefault();
            loadGraph(name);
        };
        li.appendChild(a);
        subflowList.appendChild(li);
    });

    if (sequences.length > 0) {
        const firstName = sequences[0].querySelector("SequenceGroupName").textContent;
        loadGraph(firstName);
    }
}

// Function to generate Mermaid code from XML
function generateMermaidCode(sequence) {
    console.log("Generating Mermaid code for:", sequence);
    let mermaidCode = "graph TD\n";
    const sequences = sequence.querySelectorAll("SequenceList > Sequences");
    
    sequences.forEach((seq, index) => {
        console.log(`Processing sequence ${index}:`, seq);
        
        // Directly select the Comment that is a direct child of Sequences
        const description = seq.querySelector(":scope > Comment")?.textContent?.trim() || `Sequence ${index}`;
        console.log('PaxDescription:' , description);
        const allOk = seq.querySelector("GoOnAllOk")?.textContent || "";
        const someOk = seq.querySelector("GoOnSomeOk")?.textContent || "";
        const allFail = seq.querySelector("GoOnAllFail")?.textContent || "";
        const maxAtt = seq.querySelector("GoOnMaxAttempts")?.textContent || "";
        const maxCnt = seq.querySelector("MaxAttempts")?.textContent || "";

        // Sanitize the description for Mermaid
        const sanitizedDescription = description
            .replace(/\(/g, "[")
            .replace(/\)/g, "]")
            .replace(/</g, "〈")
            .replace(/>/g, "〉");

        mermaidCode += `${index}("${index}:${sanitizedDescription}")\n`;
        
        if (allOk === someOk && someOk === allFail) {
            mermaidCode += `${index} -->${allOk}\n`;
        } else if (allOk === someOk && someOk !== allFail) {
            mermaidCode += `${index} -->|All/SomeOk|${allOk}\n`;
            mermaidCode += `${index} -->|AllFail|${allFail}\n`;
        } else if (allOk !== someOk && someOk === allFail) {
            mermaidCode += `${index} -->|AllOk|${allOk}\n`;
            mermaidCode += `${index} -->|NotAllOK|${someOk}\n`;
        } else {
            mermaidCode += `${index} -->|AllOk|${allOk}\n`;
            mermaidCode += `${index} -->|SomeOk|${someOk}\n`;
            mermaidCode += `${index} -->|AllFail|${allFail}\n`;
        }
        
        if (maxCnt && maxCnt !== "-1") {
            mermaidCode += `${index} -->|Max/${maxCnt}|${maxAtt}\n`;
        }
    });

    console.log("Generated Mermaid code:", mermaidCode);
    return mermaidCode;
}

// Function to load and display a graph
function loadGraph(sequenceName) {
    console.log("Loading graph for:", sequenceName);
    const sequence = xmlDoc.evaluate(
        `//SequencesGroup[SequenceGroupName="${sequenceName}"]`,
        xmlDoc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (sequence) {
        console.log("Found sequence:", sequence);
        const mermaidCode = generateMermaidCode(sequence);
        const graphDiv = document.getElementById('mermaid');
        graphDiv.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
        mermaid.init(undefined, ".mermaid");
    } else {
        console.error("Sequence not found:", sequenceName);
    }
}

// Load XML file
fetch('sequenceEwos.xml')
    .then(response => response.text())
    .then(xmlString => {
        xmlDoc = parseXML(xmlString);
        console.log("XML parsed:", xmlDoc);
        const sequences = xmlDoc.querySelectorAll("SequencesGroup");
        console.log("Found sequences:", sequences.length);
        const subflowList = document.getElementById('subflow-list');
        
        sequences.forEach(sequence => {
            const name = sequence.querySelector("SequenceGroupName").textContent;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = name;
            a.onclick = (e) => {
                e.preventDefault();
                loadGraph(name);
            };
            li.appendChild(a);
            subflowList.appendChild(li);
        });

        // Load the first graph
        if (sequences.length > 0) {
            const firstName = sequences[0].querySelector("SequenceGroupName").textContent;
            loadGraph(firstName);
        }
    })
    .catch(error => console.error("Error loading XML:", error));