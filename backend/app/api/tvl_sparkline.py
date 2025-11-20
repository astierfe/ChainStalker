# backend/app/api/tvl_sparkline.py - v1.0
"""
TVL Sparkline API endpoint for ChainStalker dashboard.

Provides optimized TVL historical data for sparkline visualization.
Uses centralized helpers from analytics_helpers.py (WEB3 RULESET compliant).
"""

from flask import Blueprint, request, jsonify
from app.models.metric import Metric
from app.utils.analytics_helpers import (
    calculate_time_window,
    aggregate_metrics_to_points,
    format_sparkline_data,
    get_metric_change_data
)

tvl_sparkline_bp = Blueprint('tvl_sparkline', __name__)


@tvl_sparkline_bp.route('/sparkline', methods=['GET'])
def get_tvl_sparkline():
    """
    Get TVL sparkline data for dashboard visualization.

    Query Parameters:
        hours (int, optional): Number of hours to look back (default: 24)
        points (int, optional): Number of data points to return (default: 50)

    Returns:
        JSON response with:
        - current_tvl (str): Current TVL in DAI (human-readable)
        - current_tvl_wei (str): Current TVL in Wei (for precision)
        - change_24h (float): Absolute change in DAI over the period
        - change_percent_24h (float): Percentage change over the period
        - data_points (list): Array of {timestamp, value_dai, value_wei} objects

    Example Response:
        {
            "current_tvl": "1,500.50",
            "current_tvl_wei": "1500500000000000000000",
            "change_24h": 150.25,
            "change_percent_24h": 11.11,
            "data_points": [
                {
                    "timestamp": "2024-11-19T10:15:00Z",
                    "value_dai": 1350.25,
                    "value_wei": "1350250000000000000000"
                },
                ...
            ]
        }

    Error Responses:
        400: Invalid parameters
        500: Server error
    """
    try:
        # Parse query parameters with validation
        hours = int(request.args.get('hours', 24))
        points = int(request.args.get('points', 50))

        # Validate parameters
        if hours < 1 or hours > 720:  # Max 30 days
            return jsonify({'error': 'hours must be between 1 and 720'}), 400

        if points < 10 or points > 500:
            return jsonify({'error': 'points must be between 10 and 500'}), 400

        # Get current TVL (latest metric)
        current_metric = Metric.get_latest('tvl')
        if not current_metric:
            return jsonify({
                'error': 'No TVL data available',
                'current_tvl': '0.00',
                'current_tvl_wei': '0',
                'change_24h': 0.0,
                'change_percent_24h': 0.0,
                'data_points': []
            }), 200

        current_value_wei = current_metric.get('value', 0)
        # Handle MongoDB int/string storage
        if isinstance(current_value_wei, str):
            current_value_wei = int(current_value_wei)

        current_value_dai = float(current_value_wei) / 1e18

        # Get historical data
        start_time = calculate_time_window(hours)
        history_metrics = Metric.get_history(
            metric_type='tvl',
            hours=hours,
            limit=1000  # Get more data for better aggregation
        )

        # Aggregate to target number of points (avoid sending too much data)
        aggregated_metrics = aggregate_metrics_to_points(history_metrics, points)

        # Format for frontend consumption
        formatted_data = format_sparkline_data(
            aggregated_metrics,
            value_key='value',
            convert_from_wei=True
        )

        # Calculate change metrics
        change_data = get_metric_change_data(
            current_value=current_value_dai,
            history=formatted_data,
            value_key='value_dai'
        )

        # Format current TVL with thousands separator
        current_tvl_formatted = f"{current_value_dai:,.2f}"

        return jsonify({
            'current_tvl': current_tvl_formatted,
            'current_tvl_wei': str(current_value_wei),
            'change_24h': change_data['change_absolute'],
            'change_percent_24h': change_data['change_percent'],
            'data_points': formatted_data,
            'period_hours': hours,
            'points_returned': len(formatted_data)
        }), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@tvl_sparkline_bp.route('/sparkline/current', methods=['GET'])
def get_tvl_current_only():
    """
    Get only the current TVL value (lightweight endpoint).

    Returns:
        JSON response with current TVL data only

    Example Response:
        {
            "current_tvl": "1,500.50",
            "current_tvl_wei": "1500500000000000000000",
            "current_tvl_dai": 1500.50
        }
    """
    try:
        current_metric = Metric.get_latest('tvl')
        if not current_metric:
            return jsonify({
                'current_tvl': '0.00',
                'current_tvl_wei': '0',
                'current_tvl_dai': 0.0
            }), 200

        current_value_wei = current_metric.get('value', 0)
        if isinstance(current_value_wei, str):
            current_value_wei = int(current_value_wei)

        current_value_dai = float(current_value_wei) / 1e18
        current_tvl_formatted = f"{current_value_dai:,.2f}"

        return jsonify({
            'current_tvl': current_tvl_formatted,
            'current_tvl_wei': str(current_value_wei),
            'current_tvl_dai': round(current_value_dai, 2)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500
