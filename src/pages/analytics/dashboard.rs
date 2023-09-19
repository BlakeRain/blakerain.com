use time::{Month, OffsetDateTime};
use wasm_bindgen::JsCast;
use yew::{function_component, html, use_context, use_state, Callback, Html, UseStateHandle};
use yew_hooks::{use_async_with_options, UseAsyncHandle, UseAsyncOptions};
use yew_icons::{Icon, IconId};

use crate::{
    analytics::{
        api::{get_month_views, PageViewsMonth, PageViewsMonthResult},
        auth::{AuthTokenContext, WithAuth},
    },
    components::display::bar_chart::BarChart,
};

fn month_view_chart(
    year: i32,
    month: Month,
    bar_hover: UseStateHandle<Option<usize>>,
    mut views: &[PageViewsMonth],
) -> Html {
    let ndays = time::util::days_in_year_month(year, month) as i32;

    let mut labels = Vec::new();
    let mut padded = Vec::new();
    for i in 0..ndays {
        labels.push((i + 1).to_string());

        if let Some(view) = views.first() {
            if view.day == i + 1 {
                padded.push(view.count as f32);
                views = &views[1..];
                continue;
            }
        }

        padded.push(0.0);
    }

    debug_assert_eq!(padded.len(), ndays as usize);

    let onhover = {
        let bar_hover = bar_hover.clone();
        Callback::from(move |index| bar_hover.set(Some(index)))
    };

    let onleave = {
        let bar_hover = bar_hover.clone();
        Callback::from(move |_| bar_hover.set(None))
    };

    html! {
        <BarChart labels={labels} data={padded} {onhover} {onleave} />
    }
}

fn month_select_options(active: Month) -> Html {
    let mut month = Month::January;
    let mut nodes = Vec::new();

    for _ in 0..12 {
        nodes.push(html! {
            <option
                value={month.to_string()}
                selected={month == active}>
                {month.to_string()}
            </option>
        });

        month = month.next();
    }

    nodes.into_iter().collect::<Html>()
}

#[function_component(DashboardContent)]
fn dashboard_content() -> Html {
    let now = OffsetDateTime::now_local().expect("local time");
    let token = use_context::<AuthTokenContext>().expect("AuthTokenContext to be provided");

    let year = use_state(|| now.year());
    let month = use_state(|| now.month());
    let month_result = use_state(PageViewsMonthResult::default);
    let bar_hover = use_state(|| None::<usize>);

    let load_dashboard: UseAsyncHandle<(), &'static str> = {
        let year = year.clone();
        let month = month.clone();
        let month_result = month_result.clone();

        use_async_with_options(
            async move {
                let mut result = get_month_views(&token.0, *year, (*month) as i32).await?;

                result.paths.sort_by(|a, b| {
                    let a = a.count + a.beacons;
                    (b.count + b.beacons).cmp(&a)
                });

                month_result.set(result);
                Ok(())
            },
            UseAsyncOptions::enable_auto(),
        )
    };

    let onrefresh = {
        let load_dashboard = load_dashboard.clone();
        Callback::from(move |_| load_dashboard.run())
    };

    let year_change = {
        let year = year.clone();
        let load_dashboard = load_dashboard.clone();

        Callback::from(move |event: yew::Event| {
            let input = event
                .target()
                .unwrap()
                .dyn_into::<web_sys::HtmlInputElement>()
                .unwrap();

            year.set(input.value().parse().unwrap_or(now.year()));
            load_dashboard.run();
        })
    };

    let month_change = {
        let month = month.clone();
        let load_dashboard = load_dashboard.clone();

        Callback::from(move |event: yew::Event| {
            let input = event
                .target()
                .unwrap()
                .dyn_into::<web_sys::HtmlSelectElement>()
                .unwrap();

            month.set(input.value().parse().unwrap_or(now.month()));
            load_dashboard.run();
        })
    };

    html! {
        <div class="container mx-auto flex flex-col gap-4 my-10">
            <div class="flex justify-between items-center">
                <div class="flex flex-row items-center gap-2">
                    <h1 class="text-2xl font-semibold">{"Analytics"}</h1>
                    <input
                        type="number"
                        class="w-[8rem]"
                        onchange={year_change}
                        value={(*year).to_string()} />
                    <select onchange={month_change}>
                        {month_select_options(*month)}
                    </select>
                </div>
                <button type="button" class="button" onclick={onrefresh}>
                    <Icon icon_id={IconId::LucideRefreshCw} />
                    {"Refresh"}
                </button>
            </div>
            <div class="grid 2xl:grid-cols-2 gap-4">
                <div>
                    <div class="border border-primary rounded-md pr-4">
                        {month_view_chart(*year, *month, bar_hover.clone(), &month_result.views)}
                    </div>
                    <div class="h-4 text-sm mt-2">
                        if let Some(index) = *bar_hover {
                            if let Some(day) = month_result.views.iter().find(|view| view.day == (index as i32) + 1) {
                                { format!(
                                    "{:04}-{:02}-{:02}: {} views, {} beacons, {:.2}s avg. duration, {:.2}% avg. scroll",
                                    *year,
                                    *month as u8,
                                    day.day,
                                    day.count,
                                    day.total_beacon,
                                    if day.total_beacon != 0 {
                                        day.total_scroll / day.total_beacon as f64
                                    } else {
                                        0.0
                                    },
                                    if day.total_beacon != 0 {
                                        day.total_scroll / day.total_beacon as f64
                                    } else {
                                        0.0
                                    },
                                ) }
                            }
                        }
                    </div>
                </div>
                <div>
                    <div class="table">
                        <table class="table tight">
                            <thead>
                                <tr>
                                    <th class="left">{"Path"}</th>
                                    <th class="right">{"View Count"}</th>
                                    <th class="right">{"Total Beacons"}</th>
                                    <th class="right">{"Avg. Duration"}</th>
                                    <th class="right">{"Avg. Scroll"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {for month_result.paths.iter().map(|path| html! {
                                    <tr>
                                        <td><code>{ path.path.clone() }</code></td>
                                        <td class="right">{ path.count.to_string() }</td>
                                        <td class="right">{ path.beacons.to_string() }</td>
                                        <td class="right">
                                            { format!("{:.0} s", path.avg_duration) }
                                        </td>
                                        <td class="right">
                                            { format!("{:.0}%", path.avg_scroll) }
                                        </td>
                                    </tr>
                                })}
                                <tr class="dark:bg-neutral-800">
                                    <td class="font-bold">{"Total"}</td>
                                    <td class="font-bold right">
                                        { month_result.site.count.to_string() }
                                    </td>
                                    <td class="font-bold right">
                                        { month_result.site.beacons.to_string() }
                                    </td>
                                    <td class="font-bold right">
                                        { format!("{:.0} s", month_result.site.avg_duration) }
                                    </td>
                                    <td class="font-bold right">
                                        { format!("{:.0}%", month_result.site.avg_scroll) }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    }
}

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <WithAuth>
            <DashboardContent />
        </WithAuth>
    }
}
