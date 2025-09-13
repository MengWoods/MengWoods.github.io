import yfinance as yf
import pandas as pd

# Define the date range
start_date = '2018-01-01'
end_date = '2019-01-01'

# Fetch S&P 500 data
sp500 = yf.download('^GSPC', start=start_date, end=end_date)

# Use the last valid trading day (e.g., Dec 31, 2018)
end_date = sp500.index[-1]

# Generate weekly investment dates (Mondays)
investment_dates = pd.date_range(start=start_date, end=end_date, freq='W-MON')

# Simulate weekly $100 investments
total_investment = 0
total_shares = 0

for date in investment_dates:
    if date in sp500.index:
        price = sp500.loc[date, 'Close']  # Get price as a float
        shares = 100 / price
        total_shares += shares
        total_investment += 100

# Explicitly convert final_price to a float
final_price = float(sp500.loc[end_date, 'Close'])
final_value = total_shares * final_price

# Results
print(f"Total Investment: ${total_investment:.2f}")
print(f"Final Value: ${final_value:.2f}")
print(f"Profit/Loss: ${final_value - total_investment:.2f}")