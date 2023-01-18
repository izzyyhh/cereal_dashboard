// @ts-nocheck
import './style.css'
import { csv } from 'd3'
import Chart, { ChartItem } from 'chart.js/auto'
import _ from 'lodash'
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

// Chart.defaults.color = '#fff'

interface Cereal {
  name: string
  mfr: string
  type: 'C' | 'H'
  protein: string
  calories: string
  fat: string
  sodium: string
  fiber: string
  carbo: string
  sugars: string
  potass: string
  vitamins: string
  shelf: string
  weight: string
  cups: string
  rating: string
}

const selectedManufs = new Set()
const purple = '#f18be4'
let prevColor

csv('cereals.csv').then((data) => {
  // data
  const cereals = data as unknown as Cereal[]
  const groupedManuf = _.groupBy(data as unknown as Cereal[], 'mfr')
  const perManufDataset = Object.keys(groupedManuf).map((k) => {
    return {
      manuf: k,
      cals:
        _.sum(groupedManuf[k].map((cereal) => parseInt(cereal.calories))) /
        groupedManuf[k].length,
      sugars:
        _.sum(groupedManuf[k].map((cereal) => parseInt(cereal.sugars))) /
        groupedManuf[k].length,
      nutriscore:
        _.sum(groupedManuf[k].map((cereal) => parseInt(cereal.rating))) /
        groupedManuf[k].length,
      prot:
        _.sum(groupedManuf[k].map((cereal) => parseInt(cereal.protein))) /
        groupedManuf[k].length,
    }
  })

  const calsDataset = [
    {
      label: 'Calories',
      data: perManufDataset.map((d) => d.cals),
      backgroundColor: new Array(7).fill('#64aee3'),
    },
  ]

  const sugarsDataset = [
    {
      label: 'Sugars',
      data: perManufDataset.map((d) => d.sugars),
      backgroundColor: new Array(7).fill('#e37964'),
    },
  ]

  const nutriDataset = [
    {
      label: 'Sugars',
      data: perManufDataset.map((d) => d.nutriscore),
      backgroundColor: new Array(7).fill('#16a16e'),
    },
  ]

  const protDataset = [
    {
      label: 'Sugars',
      data: perManufDataset.map((d) => d.prot),
      backgroundColor: new Array(7).fill('#70422c'),
    },
  ]

  const bubbleNutriSugarDatasets = [
    {
      label: 'Nutri-Score vs Sugars',
      data: cereals.map((c) => {
        return {
          x: parseFloat(c.rating),
          y: parseFloat(c.sugars),
          r: parseFloat(c.calories) / 10,
          ...c,
        }
      }),
    },
  ]

  const bubbleNutriSodiumDatasets = [
    {
      label: 'Nutri-Score vs Sodium',
      data: cereals.map((c) => {
        return {
          x: parseFloat(c.rating),
          y: parseFloat(c.sodium),
          r: parseFloat(c.calories) / 10,
          ...c,
        }
      }),
      hidden: true,
    },
  ]

  const bubbleNutriPotassDatasets = [
    {
      label: 'Nutri-Score vs Potassium',
      data: cereals.map((c) => {
        return {
          x: parseFloat(c.rating),
          y: parseFloat(c.potass),
          r: parseFloat(c.calories) / 10,
          ...c,
        }
      }),
      hidden: true,
    },
  ]

  const bubbleNutriFatDatasets = [
    {
      label: 'Nutri-Score vs Fat',
      data: cereals.map((c) => {
        return {
          x: parseFloat(c.rating),
          y: parseFloat(c.fat),
          r: parseFloat(c.calories) / 10,
          ...c,
        }
      }),
      hidden: true,
    },
  ]

  // charts
  const manufComparisonBarChart = new Chart(
    document.getElementById('means-manuf') as ChartItem,
    {
      type: 'bar',
      data: {
        labels: perManufDataset.map((o) => o.manuf),
        datasets: calsDataset,
      },
      options: {
        onClick: (e, el) => {
          // brushing & linking
          el[0].element
          let datasetIndex = el[0].datasetIndex
          let dataIndex = el[0].index
          let datasetLabel = e.chart.data.datasets[datasetIndex].label
          let value = e.chart.data.datasets[datasetIndex].data[dataIndex]

          // @ts-ignore
          let manuf = e.chart.data.labels[dataIndex]
          const currentColor =
            manufComparisonBarChart.data.datasets[0]['backgroundColor'][
              dataIndex
            ]

          if (currentColor == purple) {
            manufComparisonBarChart.data.datasets[0]['backgroundColor'][
              dataIndex
            ] = prevColor

            selectedManufs.delete(manuf)
          } else {
            prevColor = currentColor
            manufComparisonBarChart.data.datasets[0]['backgroundColor'][
              dataIndex
            ] = purple

            selectedManufs.add(manuf)
          }

          manufComparisonBarChart.update()

          bubbleChart.data.datasets = [
            ...bubbleNutriSugarDatasets,
            ...bubbleNutriSodiumDatasets,
            ...bubbleNutriPotassDatasets,
            ...bubbleNutriFatDatasets,
          ]

          if (selectedManufs.size != 0) {
            const filtereDatasets = bubbleChart.data.datasets.map((ds) => {
              const copy = { ...ds, borderColor: '000' }
              copy.data = copy.data.filter((c) => selectedManufs.has(c.mfr))

              return copy
            })

            bubbleChart.data.datasets = filtereDatasets
          }
          bubbleChart.update()
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            text: 'Mean Calories per Manufacturer',
            display: true,
          },
        },
      },
    }
  )

  const doughnutChart = new Chart(
    document.getElementById('doughnut') as ChartItem,
    {
      type: 'doughnut',
      data: {
        labels: ['Carbs', 'Proteins', 'Fats', 'Sugar'],
        datasets: [
          {
            label: 'Macros of Cereal',
            data: [],
            backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)',
              'rgb(255, 100, 86)',
            ],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            title: {
              text: 'Macros',
              display: false,
            },
          },
          emptyDoughnut: {
            color: 'rgba(255, 128, 0, 0.5)',
            width: 2,
            radiusDecrease: 20,
          },
        },
      },
      plugins: [
        {
          id: 'emptyDoughnut',
          afterDraw(chart, _args, options) {
            const { datasets } = chart.data
            const { color, width, radiusDecrease } = options
            let hasData = false

            for (let i = 0; i < datasets.length; i += 1) {
              const dataset = datasets[i]
              hasData ||= dataset.data.length > 0
            }

            if (!hasData) {
              const {
                chartArea: { left, top, right, bottom },
                ctx,
              } = chart
              const centerX = (left + right) / 2
              const centerY = (top + bottom) / 2
              const r = Math.min(right - left, bottom - top) / 2

              ctx.beginPath()
              ctx.lineWidth = width || 2
              ctx.strokeStyle = color || 'rgba(255, 128, 0, 0.5)'
              ctx.arc(centerX, centerY, r - radiusDecrease || 0, 0, 2 * Math.PI)
              ctx.stroke()
            }
          },
        },
      ],
    }
  )

  const radarChart = new Chart(document.getElementById('radar') as ChartItem, {
    type: 'radar',
    data: {
      labels: ['Sodium', 'Fiber', 'Vitamins', 'Potassium'],
      datasets: [
        {
          label: 'My First Dataset',
          data: [],
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)',
        },
      ],
    },
    options: {
      plugins: {
        subtitle: {
          display: false,
          text: 'More Data',
        },
        legend: {
          display: false,
        },
      },
    },
  })

  const bubbleChart = new Chart(
    document.getElementById('bubble') as ChartItem,
    {
      type: 'bubble',
      data: {
        datasets: [
          ...bubbleNutriSugarDatasets,
          ...bubbleNutriSodiumDatasets,
          ...bubbleNutriPotassDatasets,
          ...bubbleNutriFatDatasets,
        ],
      },
      options: {
        onClick: (_e, el) => {
          try {
            // @ts-ignore
            const cereal = el[0].element.$context.raw
            const doughnutDs = [
              {
                label: cereal.name,
                data: [
                  parseFloat(cereal.carbo),
                  parseFloat(cereal.protein),
                  parseFloat(cereal.fat),
                  parseFloat(cereal.sugars),
                ],
              },
            ]
            doughnutChart.data.datasets = doughnutDs
            document.getElementById('name').textContent = cereal.name
            doughnutChart.update()

            const radarDs = [
              {
                label: cereal.name,
                data: [
                  // parseFloat(cereal.calories),
                  parseFloat(cereal.sodium),
                  parseFloat(cereal.fiber) * 5,
                  parseFloat(cereal.vitamins),
                  parseFloat(cereal.rating),
                ],
              },
            ]

            radarChart.data.datasets = radarDs
            radarChart.update()
          } catch (e) {}
        },
        plugins: {
          legend: {
            display: true,
          },
          title: {
            text: 'Cereals',
            display: true,
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'xy',
            },
          },
        },
      },
    }
  )

  document.getElementById('resetzoom')?.addEventListener('click', () => {
    bubbleChart.resetZoom()
  })

  document.getElementById('cals-button')?.addEventListener('click', () => {
    manufComparisonBarChart.options.plugins.title.text =
      'Mean Calories per Manufacturer'
    manufComparisonBarChart.data.datasets = calsDataset
    manufComparisonBarChart.update()
  })

  document.getElementById('sugars-button')?.addEventListener('click', () => {
    manufComparisonBarChart.options.plugins.title.text =
      'Mean Sugars per Manufacturer'
    manufComparisonBarChart.data.datasets = sugarsDataset
    manufComparisonBarChart.update()
  })

  document.getElementById('nutri-button')?.addEventListener('click', () => {
    manufComparisonBarChart.options.plugins.title.text =
      'Mean Nutri-Score per Manufacturer'
    manufComparisonBarChart.data.datasets = nutriDataset
    manufComparisonBarChart.update()
  })

  document.getElementById('prot-button')?.addEventListener('click', () => {
    manufComparisonBarChart.options.plugins.title.text =
      'Mean Protein per Manufacturer'
    manufComparisonBarChart.data.datasets = protDataset
    manufComparisonBarChart.update()
  })
})
