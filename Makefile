build:
	rm -rf dist/
	npm run-script build-prod

deploy-stage:
	gsutil -m cp -r dist/* gs://app.truckspyapi.com/
	gsutil setmeta -h "Cache-Control:no-cache, max-age=0"  gs://app.truckspyapi.com/index.html
