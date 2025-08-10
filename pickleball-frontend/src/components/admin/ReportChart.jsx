import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { usePageTheme } from '../../hooks/usePageTheme';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportChart = ({ type, data, title, useBrandColors = true }) => {
  // 移除usePageTheme调用，避免不必要的主题切换
  // usePageTheme('admin'); // 设置页面类型为admin
  // 调试信息
  console.log('ReportChart props:', { type, data, title, useBrandColors });
  console.log('Chart components available:', { Bar, Line, Pie });
  
  // 品牌色彩方案
  const brandColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  };

  // 标准色彩方案
  const standardColors = {
    primary: '#4a90e2',
    secondary: '#7b68ee',
    success: '#5cb85c',
    warning: '#f0ad4e',
    danger: '#d9534f',
    info: '#5bc0de',
    light: '#f5f5f5',
    dark: '#333333'
  };

  const colors = useBrandColors ? brandColors : standardColors;

  // 处理数据格式
  const processData = (rawData) => {
    if (!rawData) return { labels: [], datasets: [] };

    let entries = [];
    
    // 处理不同的数据格式
    if (Array.isArray(rawData)) {
      // 如果是数组格式，转换为对象
      entries = rawData.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          // 处理对象格式的数据
          const key = item.date || item.name || item.label || `Item ${index + 1}`;
          const value = item.value || item.revenue || item.bookings || item.count || 0;
          return [key, value];
        }
        return [`Item ${index + 1}`, item];
      });
    } else if (typeof rawData === 'object') {
      // 如果是对象格式
      entries = Object.entries(rawData);
    } else {
      return { labels: [], datasets: [] };
    }
    
    // 对于时间序列数据，按日期排序
    if (entries.length > 0 && entries[0][0].match(/^\d{4}-\d{2}-\d{2}$/)) {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    const labels = entries.map(([key, value]) => {
      // 格式化日期标签
      if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(key);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return key;
    });

    const values = entries.map(([key, value]) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null) {
        // 处理Java Number对象
        if (value.doubleValue) return value.doubleValue();
        if (value.longValue) return value.longValue();
        if (value.intValue) return value.intValue();
        if (value.floatValue) return value.floatValue();
        return 0;
      }
      return 0;
    });

    return { labels, values };
  };

  // 生成图表数据
  const generateChartData = () => {
    const { labels, values } = processData(data);

    const baseDataset = {
      data: values,
      borderWidth: 2,
      borderRadius: type === 'bar' ? 4 : 0,
    };

    switch (type) {
      case 'bar':
        return {
          labels,
          datasets: [{
            ...baseDataset,
            label: title,
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderWidth: 1,
          }]
        };

      case 'line':
        return {
          labels,
          datasets: [{
            ...baseDataset,
            label: title,
            borderColor: colors.primary,
            backgroundColor: colors.primary + '20',
            fill: false,
            tension: 0.4,
            pointBackgroundColor: colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }]
        };

      case 'pie':
        // 为饼图生成不同的颜色
        const pieColors = [
          colors.primary,
          colors.success,
          colors.warning,
          colors.danger,
          colors.info,
          colors.secondary
        ];

        return {
          labels,
          datasets: [{
            ...baseDataset,
            label: title,
            backgroundColor: pieColors.slice(0, labels.length),
            borderColor: pieColors.slice(0, labels.length).map(color => color + '80'),
            borderWidth: 2,
          }]
        };

      default:
        return {
          labels,
          datasets: [{
            ...baseDataset,
            label: title,
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          }]
        };
    }
  };

  // 图表配置
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: type !== 'pie' ? {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: title.includes('Revenue') ? 'Revenue (RM)' : 'Value',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            size: 10
          },
          callback: function(value) {
            if (title.includes('Revenue')) {
              return 'RM ' + value.toLocaleString();
            }
            return value.toLocaleString();
          }
        }
      }
    } : undefined,
    elements: {
      point: {
        radius: type === 'line' ? 4 : 3,
        hoverRadius: 6
      }
    }
  };

  const chartData = generateChartData();

  // 如果没有数据，显示空状态
  if (!chartData.labels.length || !chartData.datasets[0].data.length) {
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '2px dashed #ddd'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
          <div>No data available for this chart</div>
        </div>
      </div>
    );
  }

  // 渲染对应的图表类型
  switch (type) {
    case 'bar':
      return <Bar data={chartData} options={options} height={300} />;
    case 'line':
      return <Line data={chartData} options={options} height={300} />;
    case 'pie':
      return <Pie data={chartData} options={options} height={300} />;
    default:
      return <Bar data={chartData} options={options} height={300} />;
  }
};

export default ReportChart; 