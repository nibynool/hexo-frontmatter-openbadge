const yaml = require('yaml-front-matter');
const request = require('sync-request');
const moment = require('moment');

const processDates = (data, badge) => {
	if (typeof badge.issuedOn !== 'undefined') {
		data.date = badge.issuedOn;
		data.updated = badge.issuedOn;
	}

	return data;
};

const overridePostData = (data, badge) => {
	data.title = badge.name;
	data.photos.push(badge.image);
	data.photo = badge.image;
	data.description = badge.description;

	return data;
};

const beforePostRender = (data) => {
	let badgeUrl = yaml.loadFront(data.raw).badge;
	if (badgeUrl !== undefined){
		data.badge = getBadgeData('assertion', badgeUrl);

		if (typeof data.photos === 'undefined') data.photos = [];

		data = processDates(data, data.badge);

		if (typeof data.badge.badge !== 'undefined') {
			data = overridePostData(data, data.badge.badge);
		} else {
			data = overridePostData(data, data.badge);
		}

		data.verify = verificationUrl(data.badge);
	}

	return data;
};

const verificationUrl = (assertion) => {
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

const processAssertion = (result) => {
	if (typeof result.badge !== 'undefined') {
		result.badge = getBadgeData('badgeClass', result.badge);
	}
	if (typeof result.image !== 'undefined') {
		result.image = getBadgeData('image', result.image);
	}
	if (typeof result.evidence !== 'undefined') {
		result.evidence = getBadgeData('image', result.evidence);
	}
	if (typeof result.issuedOn !== 'undefined') {
		if (moment(result.issuedOn, moment.ISO_8601, true).isValid()) {
			result.issuedOn = moment.utc(result.issuedOn, moment.ISO_8601);
		} else {
			result.issuedOn = moment.utc(result.issuedOn, 'X');
		}
	}

	return result;
};

const processBadgeClass = (result) => {
	if (typeof result.image !== 'undefined') {
		result.image = getBadgeData('image', result.image);
	}
	if (typeof result.criteria !== 'undefined') {
		result.criteria = getBadgeData('criteria', result.criteria);
	}
	if (typeof result.issuer !== 'undefined') {
		result.issuer = getBadgeData('profile', result.issuer);
	}

	return result;
};

const processProfile = (result) => {
	if (typeof result.image !== 'undefined') {
		result.image = getBadgeData('image', result.image);
	}
	if (typeof result.publicKey !== 'undefined') {
		result.publicKey = getBadgeData('cryptographicKey', result.publicKey);
	}
	if (typeof result.revocationList !== 'undefined') {
		result.revocationList = getBadgeData('revocationList', result.revocationList);
	}

	return result;
};

const processObject = (result) => {
	if (typeof result === 'object') {
		result = result.id;
	}

	return result;
};

const getBadgeData = (type, content) => {
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
			resultBody = processAssertion(resultBody);
			break;
		case 'badgeClass': // BadgeClass
			resultBody = processBadgeClass(resultBody);
			break;
		case 'profile': // Profile
			resultBody = processProfile(resultBody);
			break;
		case 'criteria': // Criteria
		case 'image': // Image
			resultBody = processObject(resultBody);
			break;
		// TODO: Add support for the following items
		case 'evidence': // Evidence
		case 'cryptographicKey': // CryptographicKey
		case 'revocationList': // RevocationList
	}

	return resultBody;
};

hexo.extend.filter.register(
	'before_post_render',
	beforePostRender
);
