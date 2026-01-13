---
license: mit
task_categories:
- time-series-forecasting
tags:
- nigeria
- agriculture
- food-systems
- synthetic
- agricultural-markets-and-pricing
size_categories:
- 100K<n<1M
---

# Nigeria Agriculture – Commodity Market Prices

## Dataset Description

Daily/weekly market prices by crop, location, volume.

**Category**: Agricultural Markets & Pricing  
**Rows**: 180,000  
**Format**: CSV, Parquet  
**License**: MIT  
**Synthetic**: Yes (generated using reference data from FAO, NBS, NiMet, FMARD)

## Dataset Structure

### Schema

- **market**: string
- **commodity**: string
- **date**: string
- **price_ngn_kg**: float
- **volume_kg**: float

### Sample Data

```
| market   | commodity   | date       |   price_ngn_kg |   volume_kg |
|:---------|:------------|:-----------|---------------:|------------:|
| Dawanau  | groundnut   | 2023-10-02 |         841.2  |      3900.3 |
| Ariaria  | oil_palm    | 2023-07-31 |          50    |      4506.9 |
| Dawanau  | cocoa       | 2022-07-15 |         347.71 |      6406.7 |
| Ariaria  | rice        | 2023-10-25 |         747.14 |      3621.6 |
| Mile 12  | sorghum     | 2022-07-18 |         650.7  |      2689.1 |
```

## Data Generation Methodology

This dataset was synthetically generated using:

1. **Reference Sources**:
   - FAO (Food and Agriculture Organization) - crop yields, production data
   - NBS (National Bureau of Statistics, Nigeria) - farm characteristics, surveys
   - NiMet (Nigerian Meteorological Agency) - weather patterns
   - FMARD (Federal Ministry of Agriculture and Rural Development) - extension guides
   - IITA (International Institute of Tropical Agriculture) - agronomic research

2. **Domain Constraints**:
   - Crop calendars and phenology (planting/harvest windows)
   - Agro-ecological zone characteristics (Sahel, Sudan Savanna, Guinea Savanna, Rainforest)
   - Nigeria-specific realities (smallholder dominance, market dynamics, conflict zones)
   - Statistical distributions matching national agricultural patterns

3. **Quality Assurance**:
   - Distribution testing (KS test, chi-square)
   - Correlation validation (rainfall-yield, fertilizer-yield, yield-price)
   - Causal consistency (DAG-based generation)
   - Multi-scale coherence (farm → state aggregations)
   - Ethical considerations (representative, unbiased)

See `QUALITY_ASSURANCE.md` in the repository for full methodology.

## Use Cases

- **Machine Learning**: Yield prediction, price forecasting, pest detection, supply chain optimization
- **Policy Analysis**: Agricultural program evaluation, subsidy impact assessment, food security planning
- **Research**: Climate-agriculture interactions, market dynamics, technology adoption patterns
- **Education**: Teaching agricultural economics, data science applications in agriculture

## Limitations

- **Synthetic data**: While grounded in real distributions, individual records are not real observations
- **Simplified dynamics**: Some complex interactions (e.g., multi-generational pest populations) are simplified
- **Temporal scope**: Covers 2022-2025; may not reflect longer-term trends or future climate scenarios
- **Spatial resolution**: State/LGA level; does not capture micro-level heterogeneity within localities

## Citation

If you use this dataset, please cite:

```bibtex
@dataset{nigeria_agriculture_2025,
  title = {Nigeria Agriculture – Commodity Market Prices},
  author = {Electric Sheep Africa},
  year = {2025},
  publisher = {Hugging Face},
  url = {https://huggingface.co/datasets/electricsheepafrica/nigerian_agriculture_commodity_market_prices}
}
```

## Related Datasets

This dataset is part of the **Nigeria Agriculture & Food Systems** collection:
- https://huggingface.co/collections/electricsheepafrica/nigeria-agriculture-and-food-systems

## Contact

For questions, feedback, or collaboration:
- **Organization**: Electric Sheep Africa
- **Collection**: Nigeria Agriculture & Food Systems
- **Repository**: https://github.com/electricsheepafrica/nigerian-datasets

## Changelog

### Version 1.0.0 (October 2025)
- Initial release
- 180,000 synthetic records
- Quality-assured using FAO/NBS/NiMet reference data
