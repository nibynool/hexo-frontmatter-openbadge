const yaml = require('yaml-front-matter');
const request = require('sync-request');
const moment = require('moment');

hexo.extend.filter.register(
	'before_post_render',
	function(data) {
		let badgeUrl = yaml.loadFront(data.raw).badge;
		if (badgeUrl !== undefined){
			data.badge = getBadgeData('assertion', badgeUrl);

			if (typeof data.photos === 'undefined') data.photos = [];

			if (typeof data.badge.issuedOn !== 'undefined') {
				data.date = data.badge.issuedOn;
				data.updated = data.badge.issuedOn;
			}

			if (typeof data.badge.badge !== 'undefined') {
				data.title = data.badge.badge.name;
				data.photos.push(data.badge.badge.image);
				data.photo = data.badge.badge.image;
				data.description = data.badge.badge.description;
			} else {
				data.title = data.badge.name;
				data.photos.push(data.badge.image);
				data.photo = data.badge.image;
				data.description = data.badge.description;
			}

			data.verify = verificationUrl(data.badge);
		}

		return data;
	}
);

let verificationUrl = function (assertion) {
	switch (assertion.badge.issuer.url) {
		case 'http://www.scrum.org':
		case 'https://www.scrum.org':
			return assertion.badge.issuer.url + '/certificates/' + assertion.uid;
		case 'http://www.ibm.com':
		case 'https://www.ibm.com':
			return 'https://www.youracclaim.com/badges/' + assertion.id.split('/').last;
		default:
			return assertion.badge.verification.url;
	}
};

let getBadgeData = function(type, content) {
	let resultBody = {};

	// In some cases the requested field can contain either a document or a remote object
	// The try/catch will return the requested URL if we don't get valid JSON
	try {
		if (typeof content === 'object') {
			resultBody = content;
		} else {
			let rawResult = request('GET', content);
			resultBody = JSON.parse(rawResult.getBody());
		}
	}
	catch (e) {
		return content;
	}

	switch (type) {
		case 'assertion': // Assertion
			if (typeof resultBody.badge !== 'undefined') {
				resultBody.badge = getBadgeData('badgeClass', resultBody.badge);
			}
			if (typeof resultBody.image !== 'undefined') {
				resultBody.image = getBadgeData('image', resultBody.image);
			}
			if (typeof resultBody.evidence !== 'undefined') {
				resultBody.evidence = getBadgeData('image', resultBody.evidence);
			}
			if (typeof resultBody.issuedOn !== 'undefined') {
				if (moment(resultBody.issuedOn, moment.ISO_8601, true).isValid()) {
					resultBody.issuedOn = moment.utc(resultBody.issuedOn, moment.ISO_8601);
				} else {
					resultBody.issuedOn = moment.utc(resultBody.issuedOn, 'X');
				}
			}
			break;
		case 'badgeClass': // BadgeClass
			if (typeof resultBody.image !== 'undefined') {
				resultBody.image = getBadgeData('image', resultBody.image);
			}
			if (typeof resultBody.criteria !== 'undefined') {
				resultBody.criteria = getBadgeData('criteria', resultBody.criteria);
			}
			if (typeof resultBody.issuer !== 'undefined') {
				resultBody.issuer = getBadgeData('profile', resultBody.issuer);
			}
			break;
		case 'profile': // Profile
			if (typeof resultBody.image !== 'undefined') {
				resultBody.image = getBadgeData('image', resultBody.image);
			}
			if (typeof resultBody.publicKey !== 'undefined') {
				resultBody.publicKey = getBadgeData('cryptographicKey', resultBody.publicKey);
			}
			if (typeof resultBody.revocationList !== 'undefined') {
				resultBody.revocationList = getBadgeData('revocationList', resultBody.revocationList);
			}
			break;
		case 'criteria': // Criteria
		case 'image': // Image
			if (typeof resultBody === 'object') {
				resultBody = resultBody.id;
			}
			break;
		case 'evidence': // Evidence
		case 'cryptographicKey': // CryptographicKey
		case 'revocationList': // RevocationList
	}

	return resultBody;
};