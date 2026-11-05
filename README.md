# Notes on Android and Perfetto internals

A small static site of long-form technical notes: explainers on the Android
runtime (ART), native memory, process ranking and freezing, the path from a
touch to pixels, Kotlin coroutines and flows, and how Perfetto's trace
processor and PerfettoSQL work.
Each note opens with an "At a glance" summary and explains the rest with SVG
figures, takeaway captions and tables.

The site is plain HTML, CSS and a little JavaScript. There is no build step, and
every link is relative, so it works on GitHub Pages and straight from disk.

## Layout

```
index.html                 landing page, one entry per note
assets/site.css            shared stylesheet (light and dark themes, mobile layout)
assets/site.js             theme toggle, reading progress bar, contents menu,
                           scrollable wide tables/figures, sortable tables
assets/icon.svg            favicon
<note>/index.html          one directory per note
```

Notes:

| Directory | Topic |
| --- | --- |
| `art_costs/` | Where the costs are in ART |
| `java_sdk_zero_copy/` | Zero-copy Java to native on ART |
| `native_memory_elf_malloc/` | Native memory on Android: ELF, the dynamic linker, mmap and malloc |
| `parcel_native_memory/` | How Parcel holds native memory across Binder calls and in system_server |
| `oom_adjuster/` | How Android decides which processes to kill, slow down or freeze |
| `input_display_pipeline/` | How a touch becomes pixels, and how Android decides a frame was late |
| `kotlin_coroutines_flows/` | Kotlin coroutines, flows, Views and Compose |
| `trace_processor_internals/` | How Perfetto's trace processor turns a trace file into SQL tables |
| `perfettosql_next/` | How PerfettoSQL is parsed and executed |
| `trace_merging/` | Merging several trace files onto one timeline |

## Viewing locally

Open `index.html` in a browser. That's all you need, since the pages work from
`file://`.

Or serve the directory over HTTP:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Disclaimer

These are personal notes. They describe public, open-source code (AOSP,
Perfetto, Kotlin) as it was when the notes were written. Figures marked as
rough or illustrative are orders of magnitude, not measurements.
