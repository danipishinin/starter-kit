const { request, gql } = require('graphql-request');

const ANALYTICS_BASE_URL = 'https://hn-ping2.hashnode.com';
const HASHNODE_ADVANCED_ANALYTICS_URL = 'https://user-analytics.hashnode.com';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;

const getBasePath = () => {
	if (BASE_URL && BASE_URL.indexOf('/') !== -1) {
		return BASE_URL.substring(BASE_URL.indexOf('/'));
	}
	return undefined;
};

const getRedirectionRules = async () => {
	const query = gql`
		query GetRedirectionRules {
			publication(host: "${host}") {
				id
				redirectionRules {
					source
					destination
					type
				}
			}
		}
  	`;

	const data = await request(GQL_ENDPOINT, query);

	if (!data.publication) {
		throw 'Please ensure you have set the env var NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST correctly.';
	}

	const redirectionRules = data.publication.redirectionRules;

	// convert to next.js redirects format
	const redirects = redirectionRules
		.filter((rule) => {
			// Hashnode gives an option to set a wildcard redirect,
			// but it doesn't work properly with Next.js
			// the solution is to filter out all the rules with wildcard and use static redirects for now
			return rule.source.indexOf('*') === -1;
		})
		.map((rule) => {
			return {
				source: rule.source,
				destination: rule.destination,
				permanent: rule.type === 'PERMANENT',
			};
		});

	return redirects;
};

/**
 * @type {import('next').NextConfig}
 */
const config = {
	transpilePackages: ['@starter-kit/utils'],
	basePath: getBasePath(),
	experimental: {
		scrollRestoration: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.hashnode.com',
			},
		],
	},
	async rewrites() {
    return [
      {
        source: "/blog",
        destination: "https://starter-ew1285ixm-danipishinins-projects.vercel.app/blog",// -> Replace https://starter-kit-rose-seven.vercel.app with your own Vercel deployment URL from step 1
      },
      {
        source: "/blog/:path*",
        destination: "https://starter-ew1285ixm-danipishinins-projects.vercel.app/blog/:path*", //-> Replace https://starter-kit-rose-seven.vercel.app with your own Vercel deployment URL from step 1
      },
    ];
  },
	async redirects() {
		return await getRedirectionRules();
	},
};

module.exports = config;
