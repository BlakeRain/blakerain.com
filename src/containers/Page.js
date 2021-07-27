import React from 'react'
import { useRouteData, Head } from 'react-static'
import { Link } from 'components/Router'

export default function Page() {
  const { page } = useRouteData();

  return (
    <div className="post-content">
      <Head>
        <title>{page.title}</title>
      </Head>
      <div dangerouslySetInnerHTML={{__html: page.html}}>
      </div>
    </div>
  );
}