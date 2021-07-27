import React from 'react'
import { useRouteData, Head } from 'react-static'
import { Link } from 'components/Router'

export default function BlogPost() {
  const { post } = useRouteData();

  return (
    <div className="post-content">
      <Head>
        <title>{post.title}</title>
      </Head>
      <div dangerouslySetInnerHTML={{__html:post.html}}>
      </div>
    </div>
  );
}