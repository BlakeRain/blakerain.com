function setupScrollLoad() {
  const outer = document.querySelector(".articles-list");
  const list = outer.querySelector(".items");
  let sentinel = document.getElementById("articles-list-sentinel");

  let lastPager = null;
  const noScriptPager = document.getElementById("articles-pager");
  if (noScriptPager) {
    lastPager = document.createElement("div");
    lastPager.id = "articles-pager";
    lastPager.hidden = true;
    lastPager.innerHTML = noScriptPager.textContent;
    noScriptPager.replaceWith(lastPager);
  }

  let observer = null;

  function fail(error) {
    console.error("Failed to load more articles:", error);

    if (observer) {
      observer.disconnect();
    }

    if (sentinel) {
      sentinel.remove();
    }

    if (lastPager) {
      lastPager.hidden = false;
    }

    const loading = sentinel.querySelector(".loading");
    if (loading) {
      loading.hidden = false;
    }
  }

  observer = new IntersectionObserver(
    (entries) => {
      let target = null,
        url = null;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        target = entry.target;
        if (!target) {
          return;
        }

        url = target.getAttribute("data-url");
        if (!url) {
          return;
        }
      });

      if (!target || !url) {
        return;
      }

      observer.unobserve(target);

      const loading = target.querySelector(".loading");
      if (loading) {
        loading.hidden = false;
      }

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.status + " " + response.statusText);
          }

          return response.text();
        })
        .then((html) => {
          const nextDoc = new DOMParser().parseFromString(html, "text/html");
          nextDoc.querySelectorAll(".articles-list > .items > article").forEach((article) => {
            list.appendChild(article);
          });

          const nextSentinel = nextDoc.querySelector("#articles-list-sentinel");
          target.remove();
          if (nextSentinel) {
            outer.appendChild(nextSentinel);
            sentinel = nextSentinel;
            observer.observe(nextSentinel);
          }

          const nextPager = nextDoc.querySelector("#articles-pager");
          if (nextPager) {
            const pager = document.createElement("div");
            pager.id = "articles-pager";
            pager.hidden = true;
            pager.innerHTML = nextPager.innerHTML;

            if (lastPager) {
              lastPager.replaceWith(pager);
            } else {
              outer.appendChild(pager);
            }

            lastPager = pager;
          }

          loading.hidden = true;
        })
        .catch(fail);
    },
    { threshold: 0, rootMargin: "200px 0px" },
  );

  observer.observe(sentinel);
}

setupScrollLoad();
