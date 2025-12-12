try:
    from plotly.offline import plot as plotly_render
    from plotly.subplots import make_subplots
    import plotly.graph_objects as go
    print("Plotly import SUCCESS")
except ImportError as e:
    print(f"Plotly import FAILED: {e}")
except Exception as e:
    print(f"Plotly import ERROR: {e}")
