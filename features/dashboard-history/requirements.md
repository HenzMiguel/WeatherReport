# Dashboard — History and anomalies

- Weekly chart covers today and the previous seven local calendar dates. Calculate daily means from available hourly values up to the current timestamp. Mark today as partial; never include future forecast hours in history.
- Return exactly 24 consecutive hourly slots ending at the latest hour at or before the source timestamp. Missing values stay null.
- Moving average uses the current and two preceding consecutive hourly slots, including slots outside the displayed window. Require all three values.
- Implement statistical temperature anomalies, not a climatological claim: compare each displayed hourly temperature with the same local hour on the preceding seven days. Require seven valid reference values; calculate population standard deviation and flag absolute z-score >= 2 with an absolute deviation >= 2 Celsius. For zero variance, flag deviations >= 2 Celsius and return null z-score. Return the reference mean, deviation, flag and methodology.
- Request eight past days so the earliest displayed hourly point has seven earlier same-hour references. The weekly chart still displays only the requested eight calendar dates.
- Show anomalies and their reference visibly, including a clear no-anomaly/insufficient-data state, accessible chart labels and an expandable table of exact values.
- State that recent history is model data provided by Open-Meteo, not a local weather station measurement.
