# GasBlender

A trimix gas blending calculator for technical diving. Given a starting cylinder composition and a target gas mix, it computes the step-by-step blending procedure (helium → oxygen → air top-up) needed to achieve that mixture.

## What it does

Technical divers breathe gas mixtures containing oxygen, helium, and nitrogen (trimix) or just oxygen and nitrogen (nitrox). Blending these gases from banks and cylinders requires precise sequencing — add too much of one component and the final mix is wrong. GasBlender automates this calculation.

You provide:
- **Start gas** — the existing contents of the cylinder (pressure in bar, O₂%, He%)
- **Finish gas** — the target mixture and final pressure
- **Helium bank** — the available He supply (pressure in bar, O₂%, He%)

It returns the ordered steps: how much helium to add, how much oxygen to add, and how much air to top up with, along with the intermediate pressure and composition at each stage.

## Architecture

The project has two parts:

```
GasBlender/
├── gas/              # Standalone Python library (core logic)
│   ├── gasblender.py       # Gas, BlendStep, TrimixBlend classes
│   ├── test_gasblender.py  # Unit tests (unittest)
│   ├── demo_gasblender.py  # Usage examples
│   └── index.html          # Static web UI
│
└── gasblender/       # Azure Functions deployment wrapper
    ├── TrimixBlend/
    │   ├── __init__.py     # HTTP trigger endpoint
    │   └── function.json   # Binding config (HTTP GET/POST)
    ├── host.json
    └── requirements.txt
```

### Backend — Azure Function App

The `gasblender/` directory is a Python Azure Functions v2 project. The `TrimixBlend` function exposes an anonymous HTTP endpoint (GET/POST) that accepts a JSON body describing the start gas, finish gas, and helium bank, then returns the complete blend plan as JSON.

Live endpoint: `https://gasblender.azurewebsites.net/api/TrimixBlend`

### Frontend — Azure Static Website

The `gas/index.html` file is a single-page web UI (jQuery + Bootstrap 5) hosted as a static website on Azure Blob Storage. It presents a form for the nine input parameters and calls the Azure Function endpoint directly, displaying the returned step-by-step blending instructions.

## API

**POST** `https://gasblender.azurewebsites.net/api/TrimixBlend`

```json
{
  "start_bar": 50,
  "start_o2": 21,
  "start_he": 0,
  "finish_bar": 200,
  "finish_o2": 21,
  "finish_he": 35,
  "helium_bar": 300,
  "helium_o2": 0,
  "helium_he": 100
}
```

## Running locally

### Core library

```bash
cd gas
python demo_gasblender.py
python -m unittest test_gasblender.py
```

### Azure Function

Requires the [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local).

```bash
cd gasblender
pip install -r requirements.txt
func host start
```

## Gas blending logic

Three blend types are supported:

| Type | Sequence |
|------|----------|
| **Trimix** | Add He → Add O₂ → Top up with air |
| **Nitrox** | Add O₂ → Top up with air |
| **Top-up** | Mix two cylinders, calculate final composition |

If the helium bank runs short during a trimix blend, the calculator adjusts the remaining steps to account for the reduced He pressure.

## Tech stack

- Python 3
- Azure Functions (Python runtime v2, extension bundle 2.x–3.0)
- Azure Blob Storage (static website hosting)
- Application Insights (telemetry sampling)
- jQuery 3.6.0 + Bootstrap 5.2.0
