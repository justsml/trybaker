const baseUrl = 'http://loyalty-api:3000/api/verify/phone'

module.exports = {
  sendCode({ phone }) {
    return fetch(`${baseUrl}/${phone}?code=new`)
      .then(response => response.json())
  },

  completeVerification({ code, phone, fName, lName, email }) {
    return fetch(`${baseUrl}/${phone}?code=${code}&e=${email}&f=${fName}&l=${lName}`)
      .then(response => response.json())
      .then(results => {
        if (results.status != 'valid' || !results.userId) {
          throw new Error('invalid session')
        }
        return results
      })
  },

  getData({ code, phone, fName, lName, email }) {
    return fetch(`${baseUrl}/${phone}?code=${code}&e=${email}&f=${fName}&l=${lName}`)
      .then(response => response.json())
  }
}
