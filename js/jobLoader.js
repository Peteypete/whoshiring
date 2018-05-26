goog.require('Matrix.Cells')
goog.require('Matrix.Model')
goog.require('Matrix.mxWeb')
goog.require('Hiring.usernote')
goog.require('Hiring.jobDomParse')
goog.provide('Hiring.jobLoader')

// --- loading job data -----------------------------------------

function jobListingLoader() {
    return div(
        iframe({
            sandbox: ""
            , src: cF( c=> {
                let searchMo = c.md.fmUp("searchMonth").value;
                return searchMo ===""? "" : "files/" + searchMo + ".html"
            })
            , style: "display: none; width:1000px; height:100px"
            , onload: md => jobsCollect(md)
        }))
}

const PARSE_CHUNK_SIZE = 100

function jobsCollect(md) {
    if (md.dom.contentDocument) { // FF
        hnBody = md.dom.contentDocument.getElementsByTagName('body')[0];
        let chunkSize = PARSE_CHUNK_SIZE
            , listing = Array.prototype.slice.call(hnBody.querySelectorAll('.athing'))
            , tempJobs = []
            , progressBar = md.fmUp("progress");

        ast(progressBar);
        progressBar.hidden = false

        if (listing.length > 0) {
            clg('listing length', listing.length)
            progressBar.max = Math.floor( listing.length / PARSE_CHUNK_SIZE)+""
            parseListings( listing, tempJobs, PARSE_CHUNK_SIZE, progressBar)
        }
    }
}

function parseListings( listing, tempJobs, chunkSize, progressBar) {
    let total = listing.length
        , totchar =0
        , chunker = offset => {
        let jct = Math.min( total - offset, chunkSize)

        if (jct > 0) {
            for (jn = 0; jn < jct; ++jn) {
                let spec = jobSpec( listing[ offset + jn])

                if (spec.OK) {
                    let hnId = spec.hnId;

                    if (!UNote.dict[hnId]) {
                        UNote.dict[hnId] = new UserNotes({hnId: hnId});
                    }
                    tempJobs.push(spec)
                    clg('spec!!!!!', JSON.stringify(spec))
                    totchar += JSON.stringify(spec).length;
                    //clg('totchar', jn, totchar)
                }
            }
            progressBar.value = progressBar.value + 1
            //window.requestAnimationFrame(() => chunker( offset + jct))

            if (tempJobs.length < 3)
                window.requestAnimationFrame(() => chunker( offset + jct))
            else {
                clg('fini!!!!!! load');
                progressBar.hidden = true
                hiringApp.jobs = tempJobs
            }
        } else {
            progressBar.hidden = true
            hiringApp.jobs = tempJobs
        }
    }
    chunker( 0);
}

function jobSpec(dom) {
    let spec = {hnId: dom.id}
    for (let n = 0; n < dom.children.length; ++n) {
        jobSpecExtend( spec, dom.children[n], 0)
    }
    return spec
}


