function _1(md){return(
md`# Billboard Top 10 Visualizations`
)}

function _billboard_hot_100_flattenedCopy(__query,FileAttachment,invalidation){return(
__query(FileAttachment("billboard_hot_100_flattened copy.csv"),{from:{table:"billboard_hot_100_flattened copy"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

async function _data(d3,FileAttachment){return(
d3.csv(await FileAttachment("billboard_hot_100_flattened copy.csv").url())
)}

function _top10Data(data){return(
data
  .filter(d => +d.rank <= 10) // keep only rank 1 to 10
  .map(d => ({
    ...d,
    rank: +d.rank,
    date: new Date(d.date),
    year: new Date(d.date).getFullYear()
  }))
)}

function _artistYearCounts(d3,top10Data){return(
Array.from(
  d3.rollup(
    top10Data,
    v => v.length,
    d => d.artist,
    d => d.year
  ),
  ([artist, yearMap]) =>
    Array.from(yearMap, ([year, count]) => ({
      artist,
      year,
      count
    }))
).flat()
)}

function _sortedArtists(d3,artistYearCounts){return(
Array.from(
  d3.rollup(
    artistYearCounts,
    v => d3.sum(v, d => d.count),
    d => d.artist
  ),
  ([artist, total]) => ({ artist, total })
)
.sort((a, b) => d3.descending(a.total, b.total))
.map(d => d.artist)
)}

function _formatName(){return(
function formatName(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
)}

function _years(artistYearCounts){return(
[...new Set(artistYearCounts.map(d => d.year))].sort((a, b) => a - b)
)}

function _heatmap(sortedArtists,artistYearCounts,html,d3,CSS,$0,$1)
{
  const topN = 50;
  const cellWidth = 50;
  const cellHeight = 30;
  const labelWidth = 200;
  const labelLeftMargin = 40;
  const maxCharLength = 16;
  const headerHeight = 80;

  let selectedRect = null;

  const formatName = str =>
    str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const topArtists = sortedArtists.slice(0, topN);
  const filteredData = artistYearCounts.filter(d => topArtists.includes(d.artist));
  const years = [...new Set(filteredData.map(d => d.year))].sort((a, b) => a - b);

  const dataWidth = years.length * cellWidth;
  const dataHeight = topN * cellHeight;

  const x = d3.scaleBand()
    .domain(years)
    .range([0, dataWidth])
    .padding(0);

  const y = d3.scaleBand()
    .domain(topArtists)
    .range([0, dataHeight])
    .padding(0);

  const maxCount = d3.max(filteredData, d => d.count);
  const alphaScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([0.1, 1]);

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "20px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // --- Corner (top-left empty block) ---
  const cornerDiv = html`<div style="
    background: #0b0c10;
    grid-column: 1; grid-row: 1;
    border-bottom: 1px solid #5ef1f2;
    border-right: 1px solid #5ef1f2;
  "></div>`;

  // --- X-axis header (top-right, scrolls horizontally only) ---
  const xAxisSvg = d3.create("svg")
    .attr("width", dataWidth)
    .attr("height", headerHeight)
    .style("background", "#0b0c10")
    .style("font-family", "JetBrains Mono, monospace")
    .style("display", "block");

  const gx = xAxisSvg.append("g")
    .attr("transform", `translate(0, ${headerHeight})`)
    .call(d3.axisTop(x).tickSizeOuter(0));

  gx.selectAll("text")
    .attr("class", d => `x-label x-label-${d}`)
    .attr("x", 0)
    .attr("y", -cellWidth / 2)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#f8f8f2")
    .style("cursor", "pointer")
    .on("click", (_, year) => {
      $0.value = year;
      $0.dispatchEvent(new CustomEvent("input"));
    });

  xAxisSvg.selectAll(".tick line").attr("stroke", "#5ef1f2");
  xAxisSvg.selectAll(".domain").attr("stroke", "#5ef1f2");

  const xAxisWrapper = html`<div style="
    grid-column: 2; grid-row: 1;
    overflow: hidden;
    border-bottom: 1px solid #5ef1f2;
  "></div>`;
  xAxisWrapper.appendChild(xAxisSvg.node());

  // --- Y-axis labels (bottom-left, scrolls vertically only) ---
  const yAxisSvg = d3.create("svg")
    .attr("width", labelWidth)
    .attr("height", dataHeight)
    .style("background", "#0b0c10")
    .style("font-family", "JetBrains Mono, monospace")
    .style("display", "block");

  topArtists.forEach((artist, i) => {
    const yPos = i * cellHeight + cellHeight / 2 + 4;
    const truncated = artist.length > maxCharLength ? artist.slice(0, maxCharLength - 3) + "..." : artist;

    yAxisSvg.append("text")
      .attr("class", `y-label y-label-${CSS.escape(artist)}`)
      .attr("x", labelLeftMargin)
      .attr("y", yPos)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .style("fill", "#f8f8f2")
      .style("font-size", "16px")
      .style("cursor", "pointer")
      .text(formatName(truncated))
      .on("click", () => {
        $1.value = artist;
        $1.dispatchEvent(new CustomEvent("input"));
      });
  });

  yAxisSvg.append("line")
    .attr("x1", labelWidth - 1)
    .attr("x2", labelWidth - 1)
    .attr("y1", 0)
    .attr("y2", dataHeight)
    .attr("stroke", "#5ef1f2")
    .attr("stroke-width", 1);

  const yAxisWrapper = html`<div style="
    grid-column: 1; grid-row: 2;
    overflow: hidden;
    border-right: 1px solid #5ef1f2;
  "></div>`;
  yAxisWrapper.appendChild(yAxisSvg.node());

  // --- Main cells (bottom-right, scrolls both directions) ---
  const mainSvg = d3.create("svg")
    .attr("width", dataWidth)
    .attr("height", dataHeight)
    .style("background", "#0b0c0c")
    .style("font-family", "JetBrains Mono, monospace")
    .style("display", "block");

  mainSvg.append("g")
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.artist))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => `rgba(94, 241, 242, ${alphaScale(d.count)})`)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 0.9);
      tooltip.html(`🎤 <b>${formatName(d.artist)}</b><br>📅 <b>${d.year}</b><br>🎶 Songs: <b>${d.count}</b>`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(150).style("opacity", 0);
    })
    .on("click", function(event, d) {
      if (selectedRect) {
        selectedRect.attr("stroke", null).attr("stroke-width", null);
      }
      d3.selectAll(".x-label").style("font-weight", "normal");
      d3.selectAll(".y-label").style("font-weight", "normal");

      d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
      d3.selectAll(`.x-label-${d.year}`).style("font-weight", "bold");
      d3.selectAll(`.y-label-${CSS.escape(d.artist)}`).style("font-weight", "bold");

      selectedRect = d3.select(this);
      $0.value = d.year;
      $0.dispatchEvent(new CustomEvent("input"));
      $1.value = d.artist;
      $1.dispatchEvent(new CustomEvent("input"));
    });

  const mainWrapper = html`<div style="
    grid-column: 2; grid-row: 2;
    overflow: auto;
  "></div>`;
  mainWrapper.appendChild(mainSvg.node());

  // --- Sync scrolling ---
  mainWrapper.addEventListener("scroll", () => {
    xAxisWrapper.scrollLeft = mainWrapper.scrollLeft;
    yAxisWrapper.scrollTop = mainWrapper.scrollTop;
  });

  // --- Title block ---
  const titleBlock = html`
    <div style="padding: 16px 0; text-align: left; max-width: 700px; margin-left: 40px;">
      <h2 style="margin: 0; font-size: 32px; color: #ffffff;">Billboard Top 10</h2>
    </div>
  `;

  const divider = html`<span></span>`;

  // --- Grid container ---
  const gridContainer = html`<div style="
    display: grid;
    grid-template-columns: ${labelWidth}px 1fr;
    grid-template-rows: ${headerHeight}px 1fr;
    flex: 1;
    min-height: 0;
    background: #0a0a0a;
    color: white;
  "></div>`;

  gridContainer.appendChild(cornerDiv);
  gridContainer.appendChild(xAxisWrapper);
  gridContainer.appendChild(yAxisWrapper);
  gridContainer.appendChild(mainWrapper);

  const outerContainer = html`<div style="
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #0a0a0a;
    color: white;
  "></div>`;

  outerContainer.appendChild(titleBlock);
  outerContainer.appendChild(divider);
  outerContainer.appendChild(gridContainer);

  return outerContainer;
}


function _selectedYear(Inputs,years){return(
Inputs.select(
  years,
  {label: "Select year", value: 2000}
)
)}

function _treemap(html,selectedYear,top10Data,d3,selectedArtist)
{
  function formatName(str) {
    return str
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const titleBlock = html`
    <div style="padding: 16px 0; text-align: left; max-width: 700px; margin-left: 40px;">
      <h2 style="margin: 0; font-size: 24px; color: #ffffff;">Top Songs in ${selectedYear}</h2>
    </div>
  `;

  const container = html`
    <div style="background: #0c0c0c;">
      ${titleBlock}
      <div style="overflow-x: auto; margin-left: 40px;"></div>
    </div>
  `;

  const year = selectedYear;
  const data = top10Data.filter(d => d.year === year);
  if (data.length === 0) return html`<div style="color:white">No data for ${year}</div>`;

  const artistTotals = Array.from(
    d3.rollup(data, v => v.length, d => d.artist),
    ([artist, count]) => ({ artist, count })
  ).sort((a, b) => d3.descending(a.count, b.count));

  const total = d3.sum(artistTotals, d => d.count);
  let cumulative = 0;
  const topArtists = [];
  for (const entry of artistTotals) {
    cumulative += entry.count;
    topArtists.push(entry.artist);
    if (cumulative / total >= 0.75) break;
  }

  const artistSongCounts = d3.rollup(
    data,
    v => v.length,
    d => d.artist,
    d => d.song
  );

  const artistGroups = [];
  let miscGroup = { name: "Other", children: [] };

  for (const [artist, songs] of artistSongCounts) {
    const children = Array.from(songs, ([song, count]) => ({
      name: song,
      value: count
    }));
    if (topArtists.includes(artist)) {
      artistGroups.push({ name: artist, children });
    } else {
      miscGroup.children.push(...children);
    }
  }

  if (miscGroup.children.length > 0) {
    artistGroups.push(miscGroup);
  }

  const hierarchy = { name: "root", children: artistGroups };
  const width = 2140;
  const height = 500;

  const root = d3.hierarchy(hierarchy)
    .sum(d => d.value || 1)
    .sort((a, b) => {
      if (a.data.name === "Other") return 1;
      if (b.data.name === "Other") return -1;
      return b.value - a.value;
    });

  d3.treemap()
    .tile(d3.treemapBinary)
    .size([width, height])
    .paddingOuter(2)
    .paddingInner(1)
    .round(true)(root);

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#0c0c0c");

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const allColors = [
    '#b2e562', '#6754e5', '#6821dd', '#141051', '#992be2',
    '#1920c8', '#621aa0', '#31147f', '#45926b', '#6f9d62',
    '#35732a', '#67dd7c', '#6de252', '#a6d5a1', '#80ea90',
    '#416db0', '#56b09b', '#6795be', '#9db2d8', '#255351'
  ];
  const otherColor = '#454c49';

  const artistColor = new Map();
  artistGroups.forEach((group, i) => {
    artistColor.set(group.name, group.name === "Other" ? otherColor : allColors[i % allColors.length]);
  });

  function getContrastColor(hex) {
    const c = d3.color(hex);
    const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    return lum > 140 ? "#0c0c0c" : "#fefefe";
  }

  const group = svg.selectAll("g.artist")
    .data(root.children)
    .join("g")
    .attr("class", "artist")
    .attr("transform", d => `translate(${d.x0},${d.y0})`)
    .each(function(d) {
      d3.select(this).style("opacity", d.data.name === selectedArtist ? 1 : 0.4);
    });

  group.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => artistColor.get(d.data.name))
    .attr("stroke", "none");

  group.append("text")
    .attr("x", 6)
    .attr("y", 16)
    .style("fill", d => getContrastColor(artistColor.get(d.data.name)))
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "11px")
    .text(d => formatName(d.data.name).slice(0, 18));

  group.append("line")
    .attr("x1", 4)
    .attr("x2", d => (d.x1 - d.x0) - 4)
    .attr("y1", 20)
    .attr("y2", 20)
    .attr("stroke", d => getContrastColor(artistColor.get(d.data.name)))
    .attr("stroke-width", 1)
    .style("stroke-dasharray", "2,2")
    .style("shape-rendering", "crispEdges");

  group.each(function(groupD) {
    const g = d3.select(this);
    if (!groupD.children) return;

    const songs = groupD.children.map(c => ({
      name: c.data.name,
      value: c.data.value
    }));

    const songRoot = d3.hierarchy({ children: songs })
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .tile(d3.treemapBinary)
      .size([groupD.x1 - groupD.x0, groupD.y1 - groupD.y0 - 20])
      .paddingInner(1)
      .round(true)(songRoot);

    const songNode = g.selectAll("g.song")
      .data(songRoot.leaves())
      .join("g")
      .attr("class", "song")
      .attr("transform", d => `translate(${d.x0},${d.y0 + 20})`);

    songNode.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", artistColor.get(groupD.data.name))
      .attr("stroke", "#222")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(100).style("opacity", 0.9);
        tooltip.html(
          `🎤 <b>${formatName(groupD.data.name)}</b><br>🎵 <b>${formatName(d.data.name)}</b><br>🔁 <b>${d.value} times</b><br>📅 <b>${year}</b>`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", `${event.pageX + 10}px`)
               .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        tooltip.transition().duration(150).style("opacity", 0);
      });

    songNode.append("text")
      .attr("x", 4)
      .attr("y", 12)
      .style("fill", getContrastColor(artistColor.get(groupD.data.name)))
      .style("font-family", "JetBrains Mono, monospace")
      .style("font-size", "9px")
      .text(d => d.data.name ? formatName(d.data.name).slice(0, 14) : "Unknown");

    songNode.append("text")
      .attr("x", 4)
      .attr("y", 22)
      .style("fill", getContrastColor(artistColor.get(groupD.data.name)))
      .style("font-family", "JetBrains Mono, monospace")
      .style("font-size", "8px")
      .text(d => `${d.value}`);
  });

  container.querySelector("div[style*='overflow-x: auto']").appendChild(svg.node());
  return container;
}


function _selectedArtist(Inputs,artistYearCounts){return(
Inputs.select(
  [...new Set(artistYearCounts.map(d => d.artist))],
  { label: "Select an Artist" }
)
)}

function _artistScrollableChart(selectedArtist,selectedYear,html,top10Data,d3)
{
  function formatName(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  const artist = selectedArtist;
  const year = selectedYear;

  const outerContainer = html`<div style="background: #0a0a0a; color: white;"></div>`;

  const pxPerWeek = 24;
  const pxGapWeek = pxPerWeek / 4;
  const height = 500;
  const margin = { top: 40, right: 30, bottom: 100, left: 50 };

  const artistData = top10Data
    .filter(d => d.artist === artist && d.rank <= 10)
    .map(d => ({ ...d, date: new Date(d.date) }));

  if (artistData.length === 0) return html`<div style="color:white">No data for ${formatName(artist)}</div>`;

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const minDate = d3.min(artistData, d => d.date);
  const maxDate = d3.max(artistData, d => d.date);
  const allWeeks = d3.timeWeek.range(minDate, d3.timeWeek.offset(maxDate, 1));
  const activeWeekSet = new Set(artistData.map(d => d3.timeWeek.floor(d.date).getTime()));

  const timeline = [];
  let currentX = margin.left;
  let gapBuffer = [];
  const gaps = [];

  for (let i = 0; i < allWeeks.length; i++) {
    const week = allWeeks[i];
    const isActive = activeWeekSet.has(week.getTime());

    if (!isActive) gapBuffer.push(week);

    if (isActive || i === allWeeks.length - 1) {
      if (gapBuffer.length > 4) {
        const xStart = currentX;
        for (const gapWeek of gapBuffer) {
          timeline.push({ week: gapWeek, x: currentX, isActive: false });
          currentX += pxGapWeek;
        }
        gaps.push({
          start: gapBuffer[0],
          end: gapBuffer[gapBuffer.length - 1],
          x: xStart,
          width: gapBuffer.length * pxGapWeek,
          count: gapBuffer.length
        });
      } else {
        for (const gapWeek of gapBuffer) {
          timeline.push({ week: gapWeek, x: currentX, isActive: true });
          currentX += pxPerWeek;
        }
      }
      gapBuffer = [];

      if (isActive) {
        timeline.push({ week, x: currentX, isActive: true });
        currentX += pxPerWeek;
      }
    }
  }

  const fullWidth = currentX + margin.right;
  const visibleWidth = 2140;
  const weekX = new Map(timeline.map(d => [d.week.getTime(), d.x]));
  const y = d3.scaleLinear().domain([10, 1]).range([height - margin.bottom, margin.top]);

  const mainSvg = d3.create("svg")
    .attr("width", fullWidth)
    .attr("height", height)
    .style("background", "#0a0a0a");

  const yAxisSvg = d3.create("svg")
    .attr("width", margin.left)
    .attr("height", height)
    .style("background", "#0a0a0a");

  yAxisSvg.append("g")
    .attr("transform", `translate(${margin.left - 1},0)`)
    .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format("d")))
    .attr("color", "#ffffff")
    .selectAll("text")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "16px");

  mainSvg.append("defs")
    .append("pattern")
    .attr("id", "diagonalHatch")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 8)
    .attr("height", 8)
    .attr("patternTransform", "rotate(45)")
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 8)
    .attr("stroke", "white")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", 1);

  const gapGroup = mainSvg.append("g");

  gapGroup.selectAll("rect")
    .data(gaps)
    .join("rect")
    .attr("x", d => d.x)
    .attr("y", margin.top)
    .attr("width", d => d.width)
    .attr("height", height - margin.bottom - margin.top)
    .attr("fill", `url(#diagonalHatch)`);

  gapGroup.selectAll("text")
    .data(gaps)
    .join("text")
    .attr("x", d => d.x + d.width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("transform", d => `rotate(-90,${d.x + d.width / 2},${height / 2})`)
    .text(d => {
      const count = d.count;
      if (count >= 52) return `${Math.round(count / 52)} Years`;
      if (count >= 4) return `${Math.round(count / 4)} Months`;
      return `${count} Weeks`;
    })
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "10px")
    .style("fill", "#fff")
    .style("pointer-events", "none")
    .each(function () {
      const bbox = this.getBBox();
      d3.select(this.parentNode)
        .insert("rect", "text")
        .attr("x", bbox.x - 2)
        .attr("y", bbox.y - 1)
        .attr("width", bbox.width + 4)
        .attr("height", bbox.height + 2)
        .attr("fill", "#000");
    });

  const songGroups = d3.groups(artistData, d => d.song);
  const songWeights = new Map(songGroups.map(([song, entries]) => [
    song, d3.sum(entries, d => 11 - d.rank)
  ]));

  const color = d3.scaleOrdinal()
    .domain(songWeights.keys())
    .range(["#00ffff", "#ff00ff", "#00ff99", "#ffcc00", "#ff66cc", "#9966ff", "#33ccff", "#ff3300"]);

  const thickness = d3.scaleLinear()
    .domain(d3.extent(Array.from(songWeights.values())))
    .range([1.5, 6]);

  mainSvg.append("g")
    .attr("class", "axis-lines")
    .selectAll("line")
    .data(d3.range(1, 11))
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", fullWidth - margin.right)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#222")
    .style("stroke-dasharray", "2,2");

  const legendData = [];

  for (const [song, entries] of songGroups) {
    const weekMap = new Map(entries.map(d => [d3.timeWeek.floor(d.date).getTime(), d.rank]));
    const songTimeline = timeline.map(w => {
      const key = w.week.getTime();
      return weekMap.has(key)
        ? { week: w.week, rank: weekMap.get(key), active: true }
        : { week: w.week, active: false };
    });

    const segments = [];
    let currentSegment = [];

    for (const point of songTimeline) {
      if (point.active) {
        currentSegment.push({ date: point.week, rank: point.rank });
      } else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    for (const segment of segments) {
      const firstPoint = segment[0];
      const firstX = weekX.get(firstPoint.date.getTime());
      legendData.push({ song, x: firstX });

      mainSvg.append("path")
        .datum(segment)
        .attr("fill", "none")
        .attr("stroke", color(song))
        .attr("stroke-width", thickness(songWeights.get(song)))
        .attr("d", d3.line()
          .x(d => weekX.get(d.date.getTime()))
          .y(d => y(d.rank)))
        .style("filter", "drop-shadow(0px 0px 2px #ffffff77)");

      const hoverGroup = mainSvg.append("g");
      const dotGroup = mainSvg.append("g");

      hoverGroup.selectAll("circle")
        .data(segment)
        .join("circle")
        .attr("cx", d => weekX.get(d.date.getTime()))
        .attr("cy", d => y(d.rank))
        .attr("r", 6)
        .attr("fill", "transparent")
        .style("pointer-events", "all")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(100).style("opacity", 0.9);
          tooltip.html(
            `🎤 <b>${formatName(artist)}</b><br>🎵 <b>${formatName(song)}</b><br>📈 Rank: <b>${d.rank}</b><br>📅 ${d3.timeFormat("%B %d, %Y")(d.date)}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
        })
        .on("mousemove", event => {
          tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(150).style("opacity", 0);
        });

      dotGroup.selectAll("circle")
        .data(segment)
        .join("circle")
        .attr("cx", d => weekX.get(d.date.getTime()))
        .attr("cy", d => y(d.rank))
        .attr("r", 2)
        .attr("fill", color(song))
        .style("filter", "drop-shadow(0 0 1px white)");
    }
  }

  const legendGroup = mainSvg.append("g");
  legendData.sort((a, b) => a.x - b.x);
  let lastRight = -Infinity;

  for (const { song, x } of legendData) {
    const formattedSong = formatName(song);
    const displayName = formattedSong.length > 12 ? formattedSong.slice(0, 10) + "…" : formattedSong;
    const estWidth = displayName.length * 6.5 + 12;

    if (x > lastRight + 8) {
      legendGroup.append("circle")
        .attr("cx", x)
        .attr("cy", margin.top - 18)
        .attr("r", 4)
        .attr("fill", color(song));

      legendGroup.append("text")
        .attr("x", x + 6)
        .attr("y", margin.top - 15)
        .attr("fill", "#ffffff")
        .attr("text-anchor", "start")
        .text(displayName)
        .style("font-family", "JetBrains Mono, monospace")
        .style("font-size", "10px");

      lastRight = x + estWidth;
    }
  }

  mainSvg.append("g")
    .selectAll("text")
    .data(timeline.filter(d => d.isActive))
    .join("text")
    .text(d => d3.timeFormat("%b %Y")(d.week))
    .attr("x", d => d.x)
    .attr("y", height - margin.bottom + 15)
    .attr("transform", d => `rotate(-90,${d.x},${height - margin.bottom + 15})`)
    .attr("text-anchor", "end")
    .attr("fill", "#aaa")
    .style("font-size", "16px")
    .style("font-family", "JetBrains Mono, monospace");

  const container = html`<div style="display:flex; align-items:flex-start;"></div>`;
  const stickyYAxis = html`<div style="position:sticky; left:0; z-index:2;">${yAxisSvg.node()}</div>`;
  const scrollArea = html`<div style="overflow-x:auto; width:${visibleWidth}px;"></div>`;
  const inner = document.createElement("div");
  inner.style.width = `${visibleWidth}px`;
  inner.appendChild(mainSvg.node());
  scrollArea.appendChild(inner);
  container.appendChild(stickyYAxis);
  container.appendChild(scrollArea);
  outerContainer.appendChild(container);

  const scrollToFirstWeek = () => {
    const firstWeekInYear = timeline.find(
      d => d.isActive && d.week.getFullYear() === year
    );

    if (firstWeekInYear) {
      const scrollX = firstWeekInYear.x - visibleWidth / 2;
      scrollArea.scrollLeft = scrollX > 0 ? scrollX : 0;
    }
  };

  setTimeout(scrollToFirstWeek, 0);
  return outerContainer;
}


function _artistRankList(selectedYear,top10Data,html,d3,selectedArtist,formatName,CSS)
{
  const year = selectedYear;
  const rows = top10Data.filter(d => d.year === year);
  if (!rows.length) return html`<div style="color:#fff; font-family: JetBrains Mono, monospace;">No data for ${year}</div>`;

  // Build both metrics:
  // - totalAppearances: total rows for artist in that year (song-weeks in Top 10, given your dataset granularity)
  // - distinctSongs: number of unique songs by artist in that year
  const metrics = Array.from(
    d3.rollup(
      rows,
      v => ({
        totalAppearances: v.length,
        distinctSongs: new Set(v.map(d => d.song)).size
      }),
      d => d.artist
    ),
    ([artist, m]) => ({ artist, ...m })
  )
    .sort((a, b) =>
      d3.descending(a.totalAppearances, b.totalAppearances) ||
      d3.descending(a.distinctSongs, b.distinctSongs) ||
      d3.ascending(a.artist, b.artist)
    );

  // Dense rank by totalAppearances (ties share rank)
  let rank = 0;
  let prev = null;
  const ranked = metrics.map(d => {
    if (prev === null || d.totalAppearances !== prev) rank += 1;
    prev = d.totalAppearances;
    return { ...d, rank };
  });

  const container = html`
    <div style="background:#0c0c0c; display:flex; flex-direction:column; height:100%; overflow:hidden;">
      <div style="margin-left:12px; margin-right:12px; flex:1; min-height:0;">
        <div
          id="rank-scroll"
          style="
            height: 100%;
            overflow-y: auto;
            border: 1px solid #1f1f1f;
            border-radius: 8px;
            background: #0c0c0c;
          "
        ></div>
      </div>
    </div>
  `;

  const list = container.querySelector("#rank-scroll");

  const BLUE = "#3b82f6";
  const GREY = "#9ca3af";
  const MUTED = "#6b7280";

  // Header row: "Rank Artist Total Appearances In Top 10 Distinct Songs In Top 10"
  const header = document.createElement("div");
  header.style.display = "grid";
  header.style.gridTemplateColumns = "50px 2fr 1fr 1fr";
  header.style.gap = "10px";
  header.style.padding = "10px 12px";
  header.style.position = "sticky";
  header.style.top = "0";
  header.style.zIndex = "2";
  header.style.background = "#0c0c0c";
  header.style.borderBottom = "1px solid #1f1f1f";
  header.style.fontFamily = "JetBrains Mono, monospace";
  header.style.fontSize = "11px";
  header.style.color = "#ffffff";

  const h1 = document.createElement("div"); h1.textContent = "Rank";
  const h2 = document.createElement("div"); h2.textContent = "Artist";
  const h3 = document.createElement("div"); h3.textContent = "Total";
  const h4 = document.createElement("div"); h4.textContent = "Unique";
  header.append(h1, h2, h3, h4);
  list.appendChild(header);

  const rowEl = d => {
    const isFocus = d.artist === selectedArtist;

    const el = document.createElement("div");
    el.id = `artist-row-${d.artist}`;
    el.style.display = "grid";
    el.style.gridTemplateColumns = "50px 2fr 1fr 1fr";
    el.style.gap = "10px";
    el.style.alignItems = "baseline";
    el.style.padding = "10px 12px";
    el.style.borderBottom = "1px solid #1f1f1f";
    el.style.fontFamily = "JetBrains Mono, monospace";
    el.style.color = isFocus ? BLUE : GREY;
    el.style.opacity = isFocus ? "1" : "0.65";

    const c1 = document.createElement("div");
    c1.textContent = `#${d.rank}`;
    c1.style.fontSize = "11px";
    c1.style.color = isFocus ? BLUE : MUTED;

    const c2 = document.createElement("div");
    c2.textContent = formatName(d.artist);
    c2.style.fontSize = "12px";
    c2.style.whiteSpace = "nowrap";
    c2.style.overflow = "hidden";
    c2.style.textOverflow = "ellipsis";

    const c3 = document.createElement("div");
    c3.textContent = `${d.totalAppearances}`;
    c3.style.fontSize = "12px";
    c3.style.textAlign = "left";

    const c4 = document.createElement("div");
    c4.textContent = `${d.distinctSongs}`;
    c4.style.fontSize = "12px";
    c4.style.textAlign = "left";

    el.append(c1, c2, c3, c4);
    return el;
  };

  ranked.forEach(d => list.appendChild(rowEl(d)));

  // Scroll to focused artist, if present
  const focusEl = list.querySelector(`#artist-row-${CSS.escape(selectedArtist ?? "")}`);
  if (focusEl) {
    requestAnimationFrame(() => {
      focusEl.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["billboard_hot_100_flattened copy.csv", {url: new URL("./files/2bd57e7392fa08884d465a46ab21704a61f1620fd0cd22d240510f2e236315003ca1b3bfc8aec984b0c0290aad9a7a586e5115e9d7bd9c13627c0085a71cb73f.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("billboard_hot_100_flattenedCopy")).define("billboard_hot_100_flattenedCopy", ["__query","FileAttachment","invalidation"], _billboard_hot_100_flattenedCopy);
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], _data);
  main.variable(observer("top10Data")).define("top10Data", ["data"], _top10Data);
  main.variable(observer("artistYearCounts")).define("artistYearCounts", ["d3","top10Data"], _artistYearCounts);
  main.variable(observer("sortedArtists")).define("sortedArtists", ["d3","artistYearCounts"], _sortedArtists);
  main.variable(observer("formatName")).define("formatName", _formatName);
  main.variable(observer("years")).define("years", ["artistYearCounts"], _years);
  main.variable(observer("viewof heatmap")).define("viewof heatmap", ["sortedArtists","artistYearCounts","html","d3","CSS","viewof selectedYear","viewof selectedArtist"], _heatmap);
  main.variable(observer("heatmap")).define("heatmap", ["Generators", "viewof heatmap"], (G, _) => G.input(_));
  main.variable(observer("viewof selectedYear")).define("viewof selectedYear", ["Inputs","years"], _selectedYear);
  main.variable(observer("selectedYear")).define("selectedYear", ["Generators", "viewof selectedYear"], (G, _) => G.input(_));
  main.variable(observer("viewof treemap")).define("viewof treemap", ["html","selectedYear","top10Data","d3","selectedArtist"], _treemap);
  main.variable(observer("treemap")).define("treemap", ["Generators", "viewof treemap"], (G, _) => G.input(_));
  main.variable(observer("viewof selectedArtist")).define("viewof selectedArtist", ["Inputs","artistYearCounts"], _selectedArtist);
  main.variable(observer("selectedArtist")).define("selectedArtist", ["Generators", "viewof selectedArtist"], (G, _) => G.input(_));
  main.variable(observer("viewof artistScrollableChart")).define("viewof artistScrollableChart", ["selectedArtist","selectedYear","html","top10Data","d3"], _artistScrollableChart);
  main.variable(observer("artistScrollableChart")).define("artistScrollableChart", ["Generators", "viewof artistScrollableChart"], (G, _) => G.input(_));
  main.variable(observer("viewof artistRankList")).define("viewof artistRankList", ["selectedYear","top10Data","html","d3","selectedArtist","formatName","CSS"], _artistRankList);
  main.variable(observer("artistRankList")).define("artistRankList", ["Generators", "viewof artistRankList"], (G, _) => G.input(_));
  return main;
}
