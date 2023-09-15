use yew::{classes, function_component, html, use_state, Callback, Html, Properties};

pub struct AxisScale {
    pub height: f32,
    pub min_value: f32,
    pub max_value: f32,
}

impl AxisScale {
    pub fn scale(&self, value: f32) -> f32 {
        self.height * (value - self.min_value) / (self.max_value - self.min_value)
    }
}

#[derive(Properties, PartialEq)]
pub struct BarChartProps {
    pub labels: Vec<String>,
    pub data: Vec<f32>,
    pub onhover: Option<Callback<usize>>,
    pub onleave: Option<Callback<()>>,
}

const CHART_WIDTH: f32 = 1000.0;
const CHART_HEIGHT: f32 = 562.0;
const TOP_OFFSET: f32 = 40.0;
const AXIS_OFFSET_X: f32 = 60.0;
const AXIS_OFFSET_Y: f32 = 40.0;
const CHART_AREA_WIDTH: f32 = CHART_WIDTH - AXIS_OFFSET_X;
const CHART_AREA_HEIGHT: f32 = CHART_HEIGHT - (TOP_OFFSET + AXIS_OFFSET_Y);
const AXIS_GRADUATION_COUNT: usize = 15;

#[function_component(BarChart)]
pub fn bar_chart(props: &BarChartProps) -> Html {
    debug_assert_eq!(props.labels.len(), props.data.len());
    let highlight = use_state(|| None::<usize>);

    let mut min_value = f32::MAX;
    let mut max_value = f32::MIN;

    for value in &props.data {
        min_value = min_value.min(*value);
        max_value = max_value.max(*value);
    }

    let scale = AxisScale {
        height: CHART_AREA_HEIGHT,
        min_value,
        max_value,
    };

    let graduations =
        ((15f32.min(max_value - min_value)).round() as usize).min(AXIS_GRADUATION_COUNT);
    let graduation_step = CHART_AREA_HEIGHT / graduations as f32;
    let bar_width = CHART_AREA_WIDTH / props.data.len() as f32;

    html! {
        <svg viewBox={format!("0 0 {} {}", CHART_WIDTH, CHART_HEIGHT)}
            xmlns="http://www.w3.org/2000/svg">
            <g transform={format!("translate({}, {})", AXIS_OFFSET_X, CHART_HEIGHT - TOP_OFFSET)}>
                <line x="0" y="0"
                    x2={CHART_AREA_WIDTH.to_string()} y2="0"
                    stroke-width="1"
                    class="stroke-black dark:stroke-white" />

                { for props.labels.iter().enumerate().map(|(index, label)| html! {
                    <g transform={format!("translate({}, 0)", (index as f32 * bar_width) + (0.5 * bar_width))}>
                        <line y2="10" x2="0" class="stroke-black dark:stroke-white" />
                        <text dy="0.71em" y="16" x="0" style="text-anchor: middle" class="fill-black dark:fill-white">
                            {label.clone()}
                        </text>
                    </g>
                })}
            </g>
            <g transform={format!("translate(0,{})", TOP_OFFSET)}>
                <line
                    x1={AXIS_OFFSET_X.to_string()}
                    y1="0"
                    x2={AXIS_OFFSET_X.to_string()}
                    y2={CHART_AREA_HEIGHT.to_string()}
                    stroke-width="1"
                    class="stroke-black dark:stroke-white" />

                <g transform={format!("translate({}, 0)", AXIS_OFFSET_X)}>
                { for (0..graduations).map(|index| {
                    let value = scale.max_value -
                        (index as f32 * (scale.max_value - scale.min_value) / graduations as f32);
                    html! {
                        <g transform={format!("translate(0, {})", index as f32 * graduation_step)}>
                            <line x2="-10" y2="0" class="stroke-black dark:stroke-white" />
                            <text dy="0.32em" x="-16" y="0" style="text-anchor: end" class="fill-black dark:fill-white">
                                {format!("{:.0}", value)}
                            </text>
                        </g>
                    }
                })}
                </g>
            </g>
            <g transform={format!("translate(0,{})", TOP_OFFSET)}>
                { for props.data.iter().enumerate().map(|(index, value)| {
                    let onhover = props.onhover.clone();
                    let onleave = props.onleave.clone();

                    if (scale.min_value - value).abs() < 0.01 {
                        return html! {}
                    }

                    html! {
                        <rect
                            x={((index as f32 * bar_width) + AXIS_OFFSET_X).to_string()}
                            y={(CHART_AREA_HEIGHT - scale.scale(*value)).to_string()}
                            width={bar_width.to_string()}
                            height={scale.scale(*value).to_string()}
                            class={
                                classes!(
                                    "cursor-pointer",
                                    if *highlight == Some(index) {
                                        "fill-slate-700 dark:fill-slate-500"
                                    } else {
                                        "fill-slate-800 dark:fill-slate-400"
                                    }
                                )
                            }
                            onmouseover={
                                let highlight = highlight.clone();
                                Callback::from(move |_| {
                                    highlight.set(Some(index));
                                    if let Some(onhover) = &onhover {
                                        onhover.emit(index);
                                    }
                                })
                            }
                            onmouseout={
                                let highlight = highlight.clone();
                                Callback::from(move |_| {
                                    highlight.set(None);
                                    if let Some(onleave) = &onleave {
                                        onleave.emit(());
                                    }
                                })
                            } />
                    }
                })}
            </g>
        </svg>
    }
}
