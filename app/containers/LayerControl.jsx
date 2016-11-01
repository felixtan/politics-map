import { forIn } from 'lodash'
import React, { PropTypes } from 'react'
import { render } from 'react-dom'
import { LayersControl, GeoJson } from 'react-leaflet'
import { getAllElectionsForCountry,
         getAllCountryLevelExecutives,
         getAllCountryLegislatorsUpper,
         getAllCountryLegislatorsLower
} from '../services/ElectedRepsService.js'
import partyCodeToColor from '../fixtures/partyColors'

// GeoJson containers
import States from './States'
import CongressionalDistricts from './CongressionalDistricts'
import Countries from './Countries'

export default class LayerControl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      electionColorDelay: 2500,
      leafletMap: props.map,
      country: 'US',
      elections: {},
      countryExecutives: {},
      countryLegislativeUpper: {},
      countryLegislativeLower: {},
      defaultStatePatternsForSenate: {},
      electionStatePatternsForSenate: {}
    }

    // Methods
    this.createDefaultStripePatternForState = this.createDefaultStripePatternForState.bind(this)
    this.createElectionStripePatternForState = this.createElectionStripePatternForState.bind(this)
    this.getPartyColor = this.getPartyColor.bind(this)

    getAllCountryLevelExecutives(this.state.country.toLowerCase()).then(res => {
      if (res.status !== 200) {
        console.log(`Looks like there was a problem. Status Code: + ${res.status}`)
        console.error(res)
      }

      res.json().then(reps => {
        delete reps._id
        this.setState({ countryExecutives: reps })
        // console.log(this.state)
      }, err => {
        console.error(err)
      })
    }, err => {
      console.error(err)
    })

    getAllCountryLegislatorsUpper(this.state.country.toLowerCase()).then(res => {
      if (res.status !== 200) {
        console.log(`Looks like there was a problem. Status Code: + ${res.status}`)
        console.error(res)
      }

      res.json().then(reps => {
        delete reps._id
        this.setState({ countryLegislativeUpper: reps })

        forIn(this.state.countryLegislativeUpper, (reps, stateCode, countryLegislativeUpper) => {
          this.createDefaultStripePatternForState(stateCode, countryLegislativeUpper)
          // this.createElectionStripePatternForState(stateCode, countryLegislativeUpper)
        })

        // console.log(this.state.defaultStatePatternsForSenate)
      }, err => {
        console.error(err)
      })
    }, err => {
      console.error(err)
    })

    getAllCountryLegislatorsLower(this.state.country.toLowerCase()).then(res => {
      if (res.status !== 200) {
        console.log(`Looks like there was a problem. Status Code: + ${res.status}`)
        console.error(res)
      }

      res.json().then(reps => {
        delete reps._id
        this.setState({ countryLegislativeLower: reps })
      }, err => {
        console.error(err)
      })
    }, err => {
      console.error(err)
    })

    getAllElectionsForCountry(this.state.country).then(res => {
      if (res.status !== 200) {
        console.log(`Looks like there was a problem. Status Code: + ${res.status}`)
        console.error(res)
      }

      res.json().then(elections => {
        this.setState({ elections: elections })
      }, err => {
        console.error(err)
      })
    }, err => {
      console.error(err)
    })
  }

  getPartyColor(partyName) {
    const code = partyName === '' ? 'IND' : partyName.substring(0, 3)
    // console.log(code)
    // console.log(partyCodeToColor)
    return partyCodeToColor[code.toUpperCase()]
  }

  /*
    called on a single state/adminSubdiv1
    assumed to contain two representatives (US Senate)
    only creates stripe pattern for two colors/parties/reps
  */
  createDefaultStripePatternForState(stateCode, repsMap) {
    const territories = ['DC', 'AS', 'PR', 'GU', 'MP', 'VI', 'UM'];
    const reps = repsMap[stateCode]

    if (territories.indexOf(stateCode) === -1) {
      const party0 = reps[0].party
      const party1 = reps[1].party
      const color0 = this.getPartyColor(party0)
      const color1 = this.getPartyColor(party1)
      // if (stateCode === 'NY') console.log(`${party0} ${party1}`)
      const pattern = new L.StripePattern({
        color: color0,
        spaceColor: color1,
        patternContentUnits: 'objectBoundingBox',
        patternUnits: 'objectBoundingBox',
        height: 0.2,
        angle: 45,
        opacity: 1.5,
        weight: 0.1,
        spaceOpacity: 1.5,
        spaceWeight: 0.1 // not working,
      })

      pattern.addTo(this.state.leafletMap)
      this.setState({ defaultStatePatternsForSenate: { ...this.state.defaultStatePatternsForSenate, [stateCode]: pattern }})
      return pattern
    } else {
      return null
    }
  }

  createElectionStripePatternForState(stateCode, repsMap) {
    const territories = ['DC', 'AS', 'PR', 'GU', 'MP', 'VI', 'UM'];
    const reps = repsMap[stateCode]

    if (territories.indexOf(stateCode) === -1) {
      // assume first senate seat in array is up for election
      const party0 = reps[0].party
      const party1 = reps[1].party
      const challengerParty = party0 === 'Democratic' ? 'Republican' : 'Democratic'
      const challengerColor = getChallengerPartyColor(party0)
      const color1 = this.getPartyColor(party1)
      // if (stateCode === 'NY') console.log(`${challengerParty} ${party1}`)
      const pattern = new L.StripePattern({
        color: challengerColor,
        spaceColor: color1,
        patternContentUnits: 'objectBoundingBox',
        patternUnits: 'objectBoundingBox',
        height: 0.2,
        angle: 45,
        opacity: 1.0,
        weight: 0.1,
        spaceOpacity: 1.0,
        spaceWeight: 0.1 // not working
      })

      pattern.addTo(this.state.leafletMap)
      this.setState({ electionStatePatternsForSenate: { ...this.state.electionStatePatternsForSenate, [stateCode]: pattern }})
      return pattern
    } else {
      return null
    }

    // party = incumbent's party
    function getChallengerPartyColor(party) {
      switch (party) {
        case 'Democratic':
          return '#ff0000';
        case 'Republican':
          return '#0000ff';
        default:
          return 'eeeeee';
      }
    }
  }

  render () {
    if (typeof this.state.elections.country === 'undefined' || this.state.elections.country === null) {
      // TODO: spinner?
      return null;
    }

    return (
      <LayersControl ref='layerControl'>
        <LayersControl.BaseLayer name='Country Executive' checked={true} ref='countryExecLayer' >
          <Countries elections={this.state.elections.country.executive}
                     reps={this.state.countryExecutives}
                     layerControl={this}
                     electionColorDelay={this.state.electionColorDelay} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name='AdminSubdiv1 Executive/country Legislature Upper' ref='countryLegisUpperLayer'>
          <States elections={this.state.elections.country.legislativeUpper}
                  reps={this.state.countryLegislativeUpper}
                  defaultPatterns={this.state.defaultStatePatternsForSenate}
                  layerControl={this}
                  electionColorDelay={this.state.electionColorDelay} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name='Country Legislature Lower' ref='countryLegisLowerLayer'>
          <CongressionalDistricts elections={this.state.elections.country.legislativeLower}
                                  reps={this.state.countryLegislativeLower}
                                  layerControl={this}
                                  electionColorDelay={this.state.electionColorDelay} />
        </LayersControl.BaseLayer>
      </LayersControl>
    )
  }
}
